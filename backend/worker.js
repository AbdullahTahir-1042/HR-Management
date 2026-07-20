import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';

const app = new Hono().basePath('/api');

// Enable CORS
app.use('*', cors());

// Authentication Middleware
const authMiddleware = async (c, next) => {
    const token = c.req.header('x-auth-token');
    if (!token) {
        return c.json({ msg: 'No token, authorization denied' }, 401);
    }
    try {
        const decoded = await verify(token, c.env.JWT_SECRET || 'your_super_secret_jwt_key_123', 'HS256');
        c.set('user', decoded.user);
        // Fire-and-forget presence heartbeat — waitUntil keeps it alive past the response.
        c.executionCtx.waitUntil(
            c.env.DB.prepare('UPDATE users SET lastSeenAt = ? WHERE id = ?')
                .bind(new Date().toISOString(), decoded.user.id).run().catch(() => {})
        );
        await next();
    } catch (err) {
        return c.json({ msg: 'Token is not valid' }, 401);
    }
};

// HR Authorization Middleware
const isHRMiddleware = async (c, next) => {
    const user = c.get('user');
    try {
        const dbUser = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(user.id).first();
        if (!dbUser || dbUser.role !== 'hr') {
            return c.json({ msg: 'Access denied. HR only.' }, 403);
        }
        await next();
    } catch (err) {
        return c.json({ msg: 'Server error during auth check' }, 500);
    }
};

// Seed default configs if DB is empty
const seedDBIfEmpty = async (db) => {
    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first('count');
    if (userCount === 0) {
        // Seed default HR account: admin@hr.com / admin123
        const adminId = crypto.randomUUID();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await db.prepare('INSERT INTO users (id, name, email, password, role, salary, department) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .bind(adminId, 'HR Administrator', 'admin@hr.com', hashedPassword, 'hr', 100000, 'hr')
            .run();
    }

    const typeCount = await db.prepare('SELECT COUNT(*) as count FROM leave_types').first('count');
    if (typeCount === 0) {
        // Seed default leave categories
        await db.prepare('INSERT INTO leave_types (id, name, quota, description) VALUES (?, ?, ?, ?)')
            .bind(crypto.randomUUID(), 'Annual Leave', 20, 'Yearly allocated vacations')
            .run();
        await db.prepare('INSERT INTO leave_types (id, name, quota, description) VALUES (?, ?, ?, ?)')
            .bind(crypto.randomUUID(), 'Sick Leave', 10, 'Medical absence leaves')
            .run();
        await db.prepare('INSERT INTO leave_types (id, name, quota, description) VALUES (?, ?, ?, ?)')
            .bind(crypto.randomUUID(), 'Casual Leave', 10, 'Urgent casual absences')
            .run();
    }
};

// Hook to seed on requests
app.use('*', async (c, next) => {
    await seedDBIfEmpty(c.env.DB);
    await next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTHENTICATION & USERS CRUD
// ─────────────────────────────────────────────────────────────────────────────

// Login
app.post('/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ msg: 'Please enter all fields' }, 400);

    const normEmail = email.toLowerCase();
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? AND isDeleted = 0').bind(normEmail).first();
    if (!user) return c.json({ msg: 'Invalid Credentials' }, 400);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return c.json({ msg: 'Invalid Credentials' }, 400);

    const payload = {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
    };
    const token = await sign(payload, c.env.JWT_SECRET || 'your_super_secret_jwt_key_123');
    return c.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Get current user details
app.get('/auth/user', authMiddleware, async (c) => {
    const user = c.get('user');
    const dbUser = await c.env.DB.prepare('SELECT id, name, email, role, status, salary, photo, department, reportingTo, phone, leaveBalance FROM users WHERE id = ?').bind(user.id).first();
    return c.json(dbUser);
});

// Register user (HR only)
app.post('/auth/register', authMiddleware, isHRMiddleware, async (c) => {
    const body = await c.req.json();
    const { name, email, password, role, status, salary, photo, department, reportingTo, phone } = body;
    if (!name || !email || !password) return c.json({ msg: 'Please enter all required fields' }, 400);

    const normEmail = email.toLowerCase();
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(normEmail).first();
    if (existing) return c.json({ msg: 'User already exists' }, 400);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();

    await c.env.DB.prepare('INSERT INTO users (id, name, email, password, role, status, salary, photo, department, reportingTo, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(
            userId,
            name,
            normEmail,
            hashedPassword,
            role || 'employee',
            status || 'full time',
            salary || 0,
            photo || '',
            department || 'development',
            reportingTo || '',
            phone || ''
        ).run();

    return c.json({ msg: 'User registered successfully', user: { id: userId, name, email: normEmail, role } });
});

// Get all users (HR only)
app.get('/auth/users', authMiddleware, isHRMiddleware, async (c) => {
    const { results } = await c.env.DB.prepare('SELECT id, name, email, role, status, salary, photo, department, reportingTo, phone, leaveBalance, createdAt FROM users WHERE isDeleted = 0 ORDER BY createdAt DESC').all();
    return c.json(results);
});

// Lightweight company directory (for messaging, etc.) — any authenticated user
app.get('/auth/colleagues', authMiddleware, async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        'SELECT id as _id, name, email, role, department, photo, lastSeenAt FROM users WHERE isDeleted = 0 AND id != ? ORDER BY name ASC'
    ).bind(user.id).all();
    return c.json(results);
});

// Update user details (Self or HR)
app.put('/auth/users/:id', authMiddleware, async (c) => {
    const reqUser = c.get('user');
    const paramId = c.req.param('id');
    const body = await c.req.json();
    const { name, email, role, status, salary, photo, department, reportingTo, phone, password } = body;

    const isSelf = reqUser.id === paramId;
    const adminUser = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(reqUser.id).first();
    const isHR = adminUser && adminUser.role === 'hr';

    if (!isSelf && !isHR) {
        return c.json({ msg: 'Access denied. You can only update your own profile.' }, 403);
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(paramId).first();
    if (!user) return c.json({ msg: 'User not found' }, 404);

    let sql = 'UPDATE users SET ';
    const params = [];
    const fields = [];

    if (name) { fields.push('name = ?'); params.push(name); }
    if (email) { fields.push('email = ?'); params.push(email.toLowerCase()); }
    if (photo !== undefined) { fields.push('photo = ?'); params.push(photo); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }

    if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        fields.push('password = ?');
        params.push(hashedPassword);
    }

    if (isHR) {
        if (role !== undefined) { fields.push('role = ?'); params.push(role); }
        if (status !== undefined) { fields.push('status = ?'); params.push(status); }
        if (salary !== undefined) { fields.push('salary = ?'); params.push(salary); }
        if (department !== undefined) { fields.push('department = ?'); params.push(department); }
        if (reportingTo !== undefined) { fields.push('reportingTo = ?'); params.push(reportingTo); }
    }

    if (fields.length === 0) return c.json({ msg: 'No fields to update' }, 400);

    sql += fields.join(', ') + ' WHERE id = ?';
    params.push(paramId);

    await c.env.DB.prepare(sql).bind(...params).run();
    return c.json({ msg: 'Profile updated successfully' });
});

// Delete user (Soft Delete) (HR only)
app.delete('/auth/users/:id', authMiddleware, isHRMiddleware, async (c) => {
    const paramId = c.req.param('id');
    const reqUser = c.get('user');

    if (reqUser.id === paramId) {
        return c.json({ msg: 'You cannot delete your own account' }, 400);
    }

    await c.env.DB.prepare('UPDATE users SET isDeleted = 1 WHERE id = ?').bind(paramId).run();
    return c.json({ msg: 'User soft-deleted successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. ATTENDANCE API
// ─────────────────────────────────────────────────────────────────────────────

// Check-in
app.post('/attendance/check-in', authMiddleware, async (c) => {
    const user = c.get('user');
    const today = new Date().toISOString().split('T')[0];

    const existing = await c.env.DB.prepare('SELECT id FROM attendance WHERE employee_id = ? AND date = ?').bind(user.id, today).first();
    if (existing) return c.json({ msg: 'Already checked in today' }, 400);

    const attId = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    await c.env.DB.prepare('INSERT INTO attendance (id, employee_id, date, checkIn) VALUES (?, ?, ?, ?)')
        .bind(attId, user.id, today, nowStr)
        .run();

    return c.json({ id: attId, employee_id: user.id, date: today, checkIn: nowStr });
});

// Check-out
app.post('/attendance/check-out', authMiddleware, async (c) => {
    const user = c.get('user');
    const today = new Date().toISOString().split('T')[0];

    const att = await c.env.DB.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').bind(user.id, today).first();
    if (!att) return c.json({ msg: 'Must check in first' }, 400);
    if (att.checkOut) return c.json({ msg: 'Already checked out today' }, 400);

    const nowStr = new Date().toISOString();
    await c.env.DB.prepare('UPDATE attendance SET checkOut = ? WHERE id = ?').bind(nowStr, att.id).run();

    return c.json({ ...att, checkOut: nowStr });
});

// Status today
app.get('/attendance/status', authMiddleware, async (c) => {
    const user = c.get('user');
    const today = new Date().toISOString().split('T')[0];
    const att = await c.env.DB.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').bind(user.id, today).first();
    return c.json(att || null);
});

// User's own history
app.get('/attendance/my-history', authMiddleware, async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC').bind(user.id).all();
    return c.json(results);
});

// All history (HR only)
app.get('/attendance/all', authMiddleware, isHRMiddleware, async (c) => {
    const { results } = await c.env.DB.prepare(
        'SELECT a.*, u.name as employee_name, u.email as employee_email FROM attendance a JOIN users u ON a.employee_id = u.id ORDER BY a.date DESC'
    ).all();
    
    // Map database properties to match Mongoose populated structures
    const formatted = results.map(r => ({
        _id: r.id,
        date: r.date,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        employee: { name: r.employee_name, email: r.employee_email }
    }));
    return c.json(formatted);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. LEAVES MANAGEMENT API
// ─────────────────────────────────────────────────────────────────────────────

// Apply Leave
app.post('/leaves/apply', authMiddleware, async (c) => {
    const user = c.get('user');
    const { startDate, endDate, reason, leaveTypeId } = await c.req.json();
    if (!startDate || !endDate || !leaveTypeId) return c.json({ msg: 'Missing required leave fields' }, 400);

    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const diffTime = Math.abs(endD - startD);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Validate type
    const leaveType = await c.env.DB.prepare('SELECT * FROM leave_types WHERE id = ?').bind(leaveTypeId).first();
    if (!leaveType) return c.json({ msg: 'Invalid leave type' }, 400);

    // Dynamic balance calculations
    const currentYear = new Date().getFullYear();
    const approvedLeaves = await c.env.DB.prepare(
        'SELECT startDate, endDate FROM leave_requests WHERE employee_id = ? AND leave_type_id = ? AND status = "approved"'
    ).bind(user.id, leaveTypeId).all();

    let usedDays = 0;
    approvedLeaves.results.forEach(l => {
        const s = new Date(l.startDate);
        const e = new Date(l.endDate);
        if (s.getFullYear() === currentYear) {
            usedDays += Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
        }
    });

    const remaining = Math.max(0, leaveType.quota - usedDays);
    if (diffDays > remaining) {
        return c.json({ msg: `Insufficient quota. Requested ${diffDays} days, but only ${remaining} days remaining.` }, 400);
    }

    const leaveId = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO leave_requests (id, employee_id, leave_type_id, startDate, endDate, reason, status) VALUES (?, ?, ?, ?, ?, ?, "pending")')
        .bind(leaveId, user.id, leaveTypeId, startDate, endDate, reason || '')
        .run();

    return c.json({ msg: 'Leave applied successfully' });
});

// Dynamic balances
app.get('/leaves/balances', authMiddleware, async (c) => {
    const user = c.get('user');
    const currentYear = new Date().getFullYear();

    const types = await c.env.DB.prepare('SELECT * FROM leave_types').all();
    const approved = await c.env.DB.prepare(
        'SELECT leave_type_id, startDate, endDate FROM leave_requests WHERE employee_id = ? AND status = "approved"'
    ).bind(user.id).all();

    const usedMap = {};
    approved.results.forEach(l => {
        const s = new Date(l.startDate);
        const e = new Date(l.endDate);
        if (s.getFullYear() === currentYear) {
            const diff = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
            usedMap[l.leave_type_id] = (usedMap[l.leave_type_id] || 0) + diff;
        }
    });

    const balances = types.results.map(t => {
        const used = usedMap[t.id] || 0;
        return {
            leaveType: { _id: t.id, name: t.name, quota: t.quota },
            allocated: t.quota,
            used,
            remaining: Math.max(0, t.quota - used)
        };
    });

    return c.json(balances);
});

// Leave configurations CRUD
app.get('/leaves/types', authMiddleware, async (c) => {
    const { results } = await c.env.DB.prepare('SELECT id as _id, name, quota, description FROM leave_types').all();
    return c.json(results);
});

app.post('/leaves/types', authMiddleware, isHRMiddleware, async (c) => {
    const { name, quota, description } = await c.req.json();
    if (!name || quota === undefined) return c.json({ msg: 'Name and quota are required' }, 400);

    const existing = await c.env.DB.prepare('SELECT id FROM leave_types WHERE LOWER(name) = ?').bind(name.toLowerCase()).first();
    if (existing) return c.json({ msg: 'Leave type already exists' }, 400);

    const typeId = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO leave_types (id, name, quota, description) VALUES (?, ?, ?, ?)')
        .bind(typeId, name, quota, description || '')
        .run();

    return c.json({ _id: typeId, name, quota, description });
});

app.put('/leaves/types/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { name, quota, description } = await c.req.json();

    const existing = await c.env.DB.prepare('SELECT id FROM leave_types WHERE LOWER(name) = ? AND id != ?').bind(name.toLowerCase(), id).first();
    if (existing) return c.json({ msg: 'Another leave type with this name exists' }, 400);

    await c.env.DB.prepare('UPDATE leave_types SET name = ?, quota = ?, description = ? WHERE id = ?')
        .bind(name, quota, description || '', id)
        .run();

    return c.json({ msg: 'Leave type updated' });
});

app.delete('/leaves/types/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const link = await c.env.DB.prepare('SELECT id FROM leave_requests WHERE leave_type_id = ?').bind(id).first();
    if (link) {
        return c.json({ msg: 'Cannot delete leave type because there are associated leave requests.' }, 400);
    }
    await c.env.DB.prepare('DELETE FROM leave_types WHERE id = ?').bind(id).run();
    return c.json({ msg: 'Leave type deleted successfully' });
});

// Employee's own leaves
app.get('/leaves/my-leaves', authMiddleware, async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        'SELECT r.id as _id, r.startDate, r.endDate, r.reason, r.status, t.name as leave_type_name FROM leave_requests r LEFT JOIN leave_types t ON r.leave_type_id = t.id WHERE r.employee_id = ? ORDER BY r.startDate DESC'
    ).bind(user.id).all();

    const formatted = results.map(r => ({
        _id: r._id,
        startDate: r.startDate,
        endDate: r.endDate,
        reason: r.reason,
        status: r.status,
        leaveType: { name: r.leave_type_name || 'Annual Leave' }
    }));
    return c.json(formatted);
});

// All requests (HR only)
app.get('/leaves/all', authMiddleware, isHRMiddleware, async (c) => {
    const { results } = await c.env.DB.prepare(
        'SELECT r.id as _id, r.startDate, r.endDate, r.reason, r.status, u.id as emp_id, u.name as emp_name, u.email as emp_email, t.name as type_name FROM leave_requests r JOIN users u ON r.employee_id = u.id LEFT JOIN leave_types t ON r.leave_type_id = t.id ORDER BY r.startDate DESC'
    ).all();

    const formatted = results.map(r => ({
        _id: r._id,
        startDate: r.startDate,
        endDate: r.endDate,
        reason: r.reason,
        status: r.status,
        employee: { _id: r.emp_id, name: r.emp_name, email: r.emp_email },
        leaveType: { name: r.type_name || 'Annual Leave' }
    }));
    return c.json(formatted);
});

// Approve/Reject leave
app.put('/leaves/:id/status', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json();

    const req = await c.env.DB.prepare('SELECT * FROM leave_requests WHERE id = ?').bind(id).first();
    if (!req) return c.json({ msg: 'Leave request not found' }, 404);

    if (status === 'approved') {
        // Double check quota limit before approval
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const reqDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        const currentYear = start.getFullYear();

        const leaveType = await c.env.DB.prepare('SELECT quota FROM leave_types WHERE id = ?').bind(req.leave_type_id).first();
        if (leaveType) {
            const approved = await c.env.DB.prepare(
                'SELECT startDate, endDate FROM leave_requests WHERE employee_id = ? AND leave_type_id = ? AND status = "approved" AND id != ?'
            ).bind(req.employee_id, req.leave_type_id, id).all();

            let used = 0;
            approved.results.forEach(l => {
                const s = new Date(l.startDate);
                const e = new Date(l.endDate);
                if (s.getFullYear() === currentYear) {
                    used += Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
                }
            });

            if (used + reqDays > leaveType.quota) {
                return c.json({ msg: 'Approval failed. Approving this request will exceed the employee\'s remaining quota.' }, 400);
            }
        }
    }

    await c.env.DB.prepare('UPDATE leave_requests SET status = ? WHERE id = ?').bind(status, id).run();
    return c.json({ msg: 'Status updated successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. HOLIDAYS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/holidays', authMiddleware, async (c) => {
    const { results } = await c.env.DB.prepare('SELECT id as _id, name, startDate, endDate, description, type FROM holidays ORDER BY startDate ASC').all();
    return c.json(results);
});

app.post('/holidays', authMiddleware, isHRMiddleware, async (c) => {
    const { name, startDate, endDate, description, type } = await c.req.json();
    if (!name || !startDate || !endDate) return c.json({ msg: 'Missing fields' }, 400);

    const holidayId = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO holidays (id, name, startDate, endDate, description, type) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(holidayId, name, startDate, endDate, description || '', type || 'public')
        .run();

    return c.json({ _id: holidayId, name, startDate, endDate, description, type });
});

app.put('/holidays/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { name, startDate, endDate, description, type } = await c.req.json();

    await c.env.DB.prepare('UPDATE holidays SET name = ?, startDate = ?, endDate = ?, description = ?, type = ? WHERE id = ?')
        .bind(name, startDate, endDate, description || '', type || 'public', id)
        .run();

    return c.json({ msg: 'Holiday updated' });
});

app.delete('/holidays/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM holidays WHERE id = ?').bind(id).run();
    return c.json({ msg: 'Holiday deleted successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ONBOARDING & TASKS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/onboarding/tasks', authMiddleware, async (c) => {
    const { results: tasks } = await c.env.DB.prepare('SELECT id as _id, title, description, category, link FROM onboarding_tasks ORDER BY createdAt ASC').all();
    const { results: completions } = await c.env.DB.prepare('SELECT * FROM onboarding_task_completions').all();

    const completionsMap = {};
    completions.forEach(c => {
        if (!completionsMap[c.task_id]) completionsMap[c.task_id] = [];
        completionsMap[c.task_id].push(c.user_id);
    });

    const formatted = tasks.map(t => ({
        ...t,
        completedBy: completionsMap[t._id] || []
    }));

    return c.json(formatted);
});

app.post('/onboarding/tasks', authMiddleware, isHRMiddleware, async (c) => {
    const { title, description, category, link } = await c.req.json();
    if (!title) return c.json({ msg: 'Title is required' }, 400);

    const taskId = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO onboarding_tasks (id, title, description, category, link) VALUES (?, ?, ?, ?, ?)')
        .bind(taskId, title, description || '', category || 'General', link || '')
        .run();

    return c.json({ _id: taskId, title, description, category, link, completedBy: [] });
});

app.put('/onboarding/tasks/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { title, description, category, link } = await c.req.json();

    await c.env.DB.prepare('UPDATE onboarding_tasks SET title = ?, description = ?, category = ?, link = ? WHERE id = ?')
        .bind(title, description || '', category || 'General', link || '', id)
        .run();

    return c.json({ msg: 'Task updated' });
});

app.delete('/onboarding/tasks/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM onboarding_tasks WHERE id = ?').bind(id).run();
    return c.json({ msg: 'Task removed' });
});

app.post('/onboarding/tasks/:id/toggle', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');

    const task = await c.env.DB.prepare('SELECT id FROM onboarding_tasks WHERE id = ?').bind(id).first();
    if (!task) return c.json({ msg: 'Task not found' }, 404);

    const existing = await c.env.DB.prepare('SELECT * FROM onboarding_task_completions WHERE task_id = ? AND user_id = ?').bind(id, user.id).first();
    if (existing) {
        await c.env.DB.prepare('DELETE FROM onboarding_task_completions WHERE task_id = ? AND user_id = ?').bind(id, user.id).run();
    } else {
        await c.env.DB.prepare('INSERT INTO onboarding_task_completions (task_id, user_id) VALUES (?, ?)').bind(id, user.id).run();
    }

    const { results } = await c.env.DB.prepare('SELECT user_id FROM onboarding_task_completions WHERE task_id = ?').bind(id).all();
    return c.json({ _id: id, completedBy: results.map(r => r.user_id) });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PRACTICE & PROVIDERS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/practice/info', authMiddleware, async (c) => {
    const info = await c.env.DB.prepare('SELECT id as _id, name, phone, email, taxId, npi, address, onboardingStep FROM practice_infos LIMIT 1').first();
    return c.json(info || null);
});

app.post('/practice/info', authMiddleware, async (c) => {
    const { name, phone, email, taxId, npi, address, onboardingStep } = await c.req.json();
    if (!name) return c.json({ msg: 'Name is required' }, 400);

    const existing = await c.env.DB.prepare('SELECT id FROM practice_infos LIMIT 1').first();

    if (existing) {
        await c.env.DB.prepare('UPDATE practice_infos SET name = ?, phone = ?, email = ?, taxId = ?, npi = ?, address = ?, onboardingStep = ? WHERE id = ?')
            .bind(name, phone || '', email || '', taxId || '', npi || '', address || '', onboardingStep || 1, existing.id)
            .run();
        return c.json({ _id: existing.id, name, phone, email, taxId, npi, address, onboardingStep });
    } else {
        const id = crypto.randomUUID();
        await c.env.DB.prepare('INSERT INTO practice_infos (id, name, phone, email, taxId, npi, address, onboardingStep) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
            .bind(id, name, phone || '', email || '', taxId || '', npi || '', address || '', onboardingStep || 1)
            .run();
        return c.json({ _id: id, name, phone, email, taxId, npi, address, onboardingStep });
    }
});

app.get('/practice/providers', authMiddleware, async (c) => {
    const { results } = await c.env.DB.prepare('SELECT id as _id, practice_id, name, npi, taxonomy, licenseNumber FROM practice_providers').all();
    return c.json(results);
});

app.post('/practice/providers', authMiddleware, async (c) => {
    const { name, npi, taxonomy, licenseNumber, practiceId } = await c.req.json();
    if (!name) return c.json({ msg: 'Name is required' }, 400);

    const providerId = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO practice_providers (id, practice_id, name, npi, taxonomy, licenseNumber) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(providerId, practiceId || '', name, npi || '', taxonomy || '', licenseNumber || '')
        .run();

    return c.json({ _id: providerId, practice_id: practiceId, name, npi, taxonomy, licenseNumber });
});

app.delete('/practice/providers/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM practice_providers WHERE id = ?').bind(id).run();
    return c.json({ msg: 'Provider deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. HR REQUESTS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/hr-requests', authMiddleware, isHRMiddleware, async (c) => {
    const { results } = await c.env.DB.prepare(
        'SELECT r.id as _id, r.subject, r.description, r.status, r.hrNote, r.createdAt, u.id as emp_id, u.name as emp_name, u.email as emp_email FROM hr_requests r JOIN users u ON r.employee_id = u.id ORDER BY r.createdAt DESC'
    ).all();

    const formatted = results.map(r => ({
        _id: r._id,
        subject: r.subject,
        description: r.description,
        status: r.status,
        hrNote: r.hrNote,
        createdAt: r.createdAt,
        employee: { _id: r.emp_id, name: r.emp_name, email: r.emp_email }
    }));
    return c.json(formatted);
});

app.get('/hr-requests/my-requests', authMiddleware, async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        'SELECT id as _id, subject, description, status, hrNote, createdAt FROM hr_requests WHERE employee_id = ? ORDER BY createdAt DESC'
    ).bind(user.id).all();
    return c.json(results);
});

app.post('/hr-requests', authMiddleware, async (c) => {
    const user = c.get('user');
    const { subject, description } = await c.req.json();
    if (!subject || !description) return c.json({ msg: 'Subject and description are required' }, 400);

    const requestId = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO hr_requests (id, employee_id, subject, description, status) VALUES (?, ?, ?, ?, "pending")')
        .bind(requestId, user.id, subject, description)
        .run();

    return c.json({ msg: 'Request submitted successfully' });
});

app.put('/hr-requests/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { status, hrNote } = await c.req.json();

    await c.env.DB.prepare('UPDATE hr_requests SET status = ?, hrNote = ? WHERE id = ?')
        .bind(status, hrNote || '', id)
        .run();

    return c.json({ msg: 'Request updated' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. CONVERSATIONS & MESSAGES API (Direct Messages + Groups)
// ─────────────────────────────────────────────────────────────────────────────

const TYPING_TTL_MS = 6000;

const isAdminOfRow = (conversationRow, userId) => {
    const adminIds = JSON.parse(conversationRow.admins || '[]');
    return conversationRow.createdBy === userId || adminIds.includes(userId);
};

const hydrateConversations = async (db, conversationIds, userId) => {
    if (conversationIds.length === 0) return [];
    const placeholders = conversationIds.map(() => '?').join(',');

    const { results: convRows } = await db.prepare(
        `SELECT id, type, name, createdBy, admins, lastMessageAt, createdAt FROM conversations WHERE id IN (${placeholders})`
    ).bind(...conversationIds).all();

    const { results: participantRows } = await db.prepare(
        `SELECT cp.conversation_id, u.id as _id, u.name, u.email, u.photo, u.role, u.department, u.lastSeenAt
         FROM conversation_participants cp JOIN users u ON cp.user_id = u.id
         WHERE cp.conversation_id IN (${placeholders})`
    ).bind(...conversationIds).all();

    const { results: lastMessages } = await db.prepare(
        `SELECT conversation_id, sender_id, text, createdAt FROM messages
         WHERE conversation_id IN (${placeholders}) ORDER BY createdAt DESC`
    ).bind(...conversationIds).all();

    const { results: unreadRows } = await db.prepare(
        `SELECT m.conversation_id as conversation_id FROM messages m
         WHERE m.conversation_id IN (${placeholders}) AND m.sender_id != ?
           AND m.id NOT IN (SELECT message_id FROM message_reads WHERE user_id = ?)`
    ).bind(...conversationIds, userId, userId).all();

    const participantsByConv = {};
    participantRows.forEach(p => {
        if (!participantsByConv[p.conversation_id]) participantsByConv[p.conversation_id] = [];
        participantsByConv[p.conversation_id].push({ _id: p._id, name: p.name, email: p.email, photo: p.photo, role: p.role, department: p.department, lastSeenAt: p.lastSeenAt });
    });

    const lastMessageByConv = {};
    lastMessages.forEach(m => {
        if (!lastMessageByConv[m.conversation_id]) lastMessageByConv[m.conversation_id] = m;
    });

    const unreadByConv = {};
    unreadRows.forEach(r => {
        unreadByConv[r.conversation_id] = (unreadByConv[r.conversation_id] || 0) + 1;
    });

    return convRows.map(conv => {
        const participants = participantsByConv[conv.id] || [];
        const other = conv.type === 'dm' ? participants.find(p => p._id !== userId) : null;
        const last = lastMessageByConv[conv.id];
        const adminIds = JSON.parse(conv.admins || '[]');
        return {
            _id: conv.id,
            type: conv.type,
            name: conv.type === 'group' ? conv.name : (other?.name || 'Unknown User'),
            photo: conv.type === 'dm' ? (other?.photo || null) : null,
            participants,
            memberCount: participants.length,
            adminIds,
            viewerIsAdmin: conv.type === 'group' ? isAdminOfRow(conv, userId) : false,
            otherUser: other ? { _id: other._id, name: other.name, lastSeenAt: other.lastSeenAt } : null,
            lastMessage: last?.text || '',
            lastMessageAt: last?.createdAt || conv.createdAt,
            lastMessageFromMe: last ? last.sender_id === userId : false,
            unreadCount: unreadByConv[conv.id] || 0
        };
    }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
};

// List all conversations (DMs + groups) for the logged-in user
app.get('/conversations', authMiddleware, async (c) => {
    const user = c.get('user');
    const { results } = await c.env.DB.prepare(
        'SELECT conversation_id FROM conversation_participants WHERE user_id = ?'
    ).bind(user.id).all();

    const hydrated = await hydrateConversations(c.env.DB, results.map(r => r.conversation_id), user.id);
    return c.json(hydrated);
});

// Get the existing DM with a user, or create one
app.post('/conversations/dm', authMiddleware, async (c) => {
    const user = c.get('user');
    const { userId } = await c.req.json();
    if (!userId) return c.json({ msg: 'A valid userId is required' }, 400);
    if (userId === user.id) return c.json({ msg: 'Cannot start a conversation with yourself' }, 400);

    const otherUser = await c.env.DB.prepare('SELECT id FROM users WHERE id = ? AND isDeleted = 0').bind(userId).first();
    if (!otherUser) return c.json({ msg: 'User not found' }, 404);

    const existing = await c.env.DB.prepare(
        `SELECT c.id FROM conversations c
         WHERE c.type = 'dm'
           AND c.id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = ?)
           AND c.id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = ?)`
    ).bind(user.id, userId).first();

    let conversationId = existing?.id;

    if (!conversationId) {
        conversationId = crypto.randomUUID();
        const now = new Date().toISOString();
        await c.env.DB.prepare(
            'INSERT INTO conversations (id, type, name, createdBy, lastMessageAt, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(conversationId, 'dm', '', user.id, now, now).run();
        await c.env.DB.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)')
            .bind(conversationId, user.id).run();
        await c.env.DB.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)')
            .bind(conversationId, userId).run();
    }

    const [hydrated] = await hydrateConversations(c.env.DB, [conversationId], user.id);
    return c.json(hydrated);
});

// Create a new group conversation
app.post('/conversations/group', authMiddleware, async (c) => {
    const user = c.get('user');
    const { name, participantIds } = await c.req.json();
    if (!name || !name.trim()) return c.json({ msg: 'Group name is required' }, 400);

    const ids = Array.isArray(participantIds) ? participantIds : [];
    if (ids.length < 1) return c.json({ msg: 'Select at least one other participant' }, 400);

    const uniqueParticipants = Array.from(new Set([user.id, ...ids]));
    const placeholders = uniqueParticipants.map(() => '?').join(',');
    const { results: foundUsers } = await c.env.DB.prepare(
        `SELECT id FROM users WHERE id IN (${placeholders}) AND isDeleted = 0`
    ).bind(...uniqueParticipants).all();
    if (foundUsers.length !== uniqueParticipants.length) {
        return c.json({ msg: 'One or more selected users could not be found' }, 400);
    }

    const conversationId = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
        'INSERT INTO conversations (id, type, name, createdBy, admins, lastMessageAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(conversationId, 'group', name.trim(), user.id, JSON.stringify([user.id]), now, now).run();

    for (const participantId of uniqueParticipants) {
        await c.env.DB.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)')
            .bind(conversationId, participantId).run();
    }

    const [hydrated] = await hydrateConversations(c.env.DB, [conversationId], user.id);
    return c.json(hydrated, 201);
});

// Rename a group
app.put('/conversations/:id', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const conversation = await c.env.DB.prepare('SELECT * FROM conversations WHERE id = ?').bind(id).first();
    if (!conversation) return c.json({ msg: 'Conversation not found' }, 404);
    if (conversation.type !== 'group') return c.json({ msg: 'Only groups can be renamed' }, 400);
    if (!isAdminOfRow(conversation, user.id)) return c.json({ msg: 'Only group admins can rename the group' }, 403);

    const { name } = await c.req.json();
    if (!name || !name.trim()) return c.json({ msg: 'Group name is required' }, 400);

    await c.env.DB.prepare('UPDATE conversations SET name = ? WHERE id = ?').bind(name.trim(), id).run();

    const [hydrated] = await hydrateConversations(c.env.DB, [id], user.id);
    return c.json(hydrated);
});

// Add members to a group
app.put('/conversations/:id/participants', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const conversation = await c.env.DB.prepare('SELECT * FROM conversations WHERE id = ?').bind(id).first();
    if (!conversation) return c.json({ msg: 'Conversation not found' }, 404);
    if (conversation.type !== 'group') return c.json({ msg: 'Only groups support adding members' }, 400);

    const membership = await c.env.DB.prepare(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).bind(id, user.id).first();
    if (!membership) return c.json({ msg: 'Access denied' }, 403);

    const { participantIds } = await c.req.json();
    const ids = Array.isArray(participantIds) ? participantIds : [];
    if (ids.length === 0) return c.json({ msg: 'No participants provided' }, 400);

    const placeholders = ids.map(() => '?').join(',');
    const { results: foundUsers } = await c.env.DB.prepare(
        `SELECT id FROM users WHERE id IN (${placeholders}) AND isDeleted = 0`
    ).bind(...ids).all();
    if (foundUsers.length !== ids.length) return c.json({ msg: 'One or more users could not be found' }, 400);

    for (const participantId of ids) {
        await c.env.DB.prepare('INSERT OR IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)')
            .bind(id, participantId).run();
    }

    const [hydrated] = await hydrateConversations(c.env.DB, [id], user.id);
    return c.json(hydrated);
});

// Toggle a member's admin status
app.put('/conversations/:id/participants/:userId/promote', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const targetId = c.req.param('userId');

    const conversation = await c.env.DB.prepare('SELECT * FROM conversations WHERE id = ?').bind(id).first();
    if (!conversation) return c.json({ msg: 'Conversation not found' }, 404);
    if (conversation.type !== 'group') return c.json({ msg: 'Only groups have admins' }, 400);
    if (!isAdminOfRow(conversation, user.id)) return c.json({ msg: 'Only group admins can manage admins' }, 403);

    const membership = await c.env.DB.prepare(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).bind(id, targetId).first();
    if (!membership) return c.json({ msg: 'User is not a member of this group' }, 400);

    const adminIds = new Set(JSON.parse(conversation.admins || '[]'));
    if (adminIds.has(targetId)) adminIds.delete(targetId); else adminIds.add(targetId);
    await c.env.DB.prepare('UPDATE conversations SET admins = ? WHERE id = ?')
        .bind(JSON.stringify(Array.from(adminIds)), id).run();

    const [hydrated] = await hydrateConversations(c.env.DB, [id], user.id);
    return c.json(hydrated);
});

// Leave a group
app.delete('/conversations/:id/participants/me', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const conversation = await c.env.DB.prepare('SELECT * FROM conversations WHERE id = ?').bind(id).first();
    if (!conversation) return c.json({ msg: 'Conversation not found' }, 404);
    if (conversation.type !== 'group') return c.json({ msg: 'Cannot leave a direct message' }, 400);

    await c.env.DB.prepare('DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?')
        .bind(id, user.id).run();

    const remainingAdmins = JSON.parse(conversation.admins || '[]').filter(a => a !== user.id);
    await c.env.DB.prepare('UPDATE conversations SET admins = ? WHERE id = ?')
        .bind(JSON.stringify(remainingAdmins), id).run();

    return c.json({ msg: 'Left group' });
});

// Remove a specific member from a group (admin-only — distinct from self-leave above)
app.delete('/conversations/:id/participants/:userId', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const targetId = c.req.param('userId');

    const conversation = await c.env.DB.prepare('SELECT * FROM conversations WHERE id = ?').bind(id).first();
    if (!conversation) return c.json({ msg: 'Conversation not found' }, 404);
    if (conversation.type !== 'group') return c.json({ msg: 'Cannot remove members from a direct message' }, 400);
    if (!isAdminOfRow(conversation, user.id)) return c.json({ msg: 'Only group admins can remove members' }, 403);
    if (targetId === user.id) return c.json({ msg: 'Use the leave-group action to remove yourself' }, 400);

    await c.env.DB.prepare('DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?')
        .bind(id, targetId).run();

    const remainingAdmins = JSON.parse(conversation.admins || '[]').filter(a => a !== targetId);
    await c.env.DB.prepare('UPDATE conversations SET admins = ? WHERE id = ?')
        .bind(JSON.stringify(remainingAdmins), id).run();

    const [hydrated] = await hydrateConversations(c.env.DB, [id], user.id);
    return c.json(hydrated);
});

// Ping "I'm typing" — expires on its own after a few seconds
app.post('/conversations/:id/typing', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const membership = await c.env.DB.prepare(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).bind(id, user.id).first();
    if (!membership) return c.json({ msg: 'Access denied' }, 403);

    const typingUntil = new Date(Date.now() + TYPING_TTL_MS).toISOString();
    await c.env.DB.prepare(
        `INSERT INTO typing_status (conversation_id, user_id, typingUntil) VALUES (?, ?, ?)
         ON CONFLICT (conversation_id, user_id) DO UPDATE SET typingUntil = excluded.typingUntil`
    ).bind(id, user.id, typingUntil).run();

    return c.json({ msg: 'ok' });
});

// Get a page of the thread (newest-first cursor via ?before=<messageId>),
// mark delivered/read, and return who's currently typing.
app.get('/conversations/:id/messages', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const membership = await c.env.DB.prepare(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).bind(id, user.id).first();
    if (!membership) return c.json({ msg: 'Access denied' }, 403);

    const limit = Math.min(parseInt(c.req.query('limit') || '50', 10) || 50, 100);
    const before = c.req.query('before');

    let beforeCreatedAt = null;
    if (before) {
        const beforeMsg = await c.env.DB.prepare('SELECT createdAt FROM messages WHERE id = ?').bind(before).first();
        if (beforeMsg) beforeCreatedAt = beforeMsg.createdAt;
    }

    const whereClause = beforeCreatedAt ? 'WHERE m.conversation_id = ? AND m.createdAt < ?' : 'WHERE m.conversation_id = ?';
    const bindArgs = beforeCreatedAt ? [id, beforeCreatedAt] : [id];

    const { results: rawMessages } = await c.env.DB.prepare(
        `SELECT m.id as _id, m.text, m.createdAt, m.replyTo,
                u.id as sender_id, u.name as sender_name, u.email as sender_email, u.photo as sender_photo
         FROM messages m JOIN users u ON m.sender_id = u.id
         ${whereClause}
         ORDER BY m.createdAt DESC LIMIT ?`
    ).bind(...bindArgs, limit).all();

    const hasMore = rawMessages.length === limit;
    const pageIds = rawMessages.map(m => m._id);
    const orderedMessages = rawMessages.slice().reverse();

    // Delivered = this participant's client has now fetched the thread.
    await c.env.DB.prepare(
        `INSERT OR IGNORE INTO message_delivered (message_id, user_id)
         SELECT id, ? FROM messages WHERE conversation_id = ? AND sender_id != ?`
    ).bind(user.id, id, user.id).run();

    // Opening the thread means catching up — mark everything seen.
    await c.env.DB.prepare(
        `INSERT OR IGNORE INTO message_reads (message_id, user_id)
         SELECT id, ? FROM messages WHERE conversation_id = ? AND sender_id != ?`
    ).bind(user.id, id, user.id).run();

    const [conversation] = await hydrateConversations(c.env.DB, [id], user.id);
    if (!conversation) return c.json({ msg: 'Conversation not found' }, 404);

    const totalRecipients = conversation.participants.filter(p => p._id !== user.id).length;

    const deliveredCounts = {}, readCounts = {}, replyMap = {};
    if (pageIds.length > 0) {
        const ph = pageIds.map(() => '?').join(',');

        const { results: deliveredRows } = await c.env.DB.prepare(
            `SELECT message_id, COUNT(*) as cnt FROM message_delivered WHERE message_id IN (${ph}) AND user_id != ? GROUP BY message_id`
        ).bind(...pageIds, user.id).all();
        deliveredRows.forEach(r => { deliveredCounts[r.message_id] = r.cnt; });

        const { results: readRows } = await c.env.DB.prepare(
            `SELECT message_id, COUNT(*) as cnt FROM message_reads WHERE message_id IN (${ph}) AND user_id != ? GROUP BY message_id`
        ).bind(...pageIds, user.id).all();
        readRows.forEach(r => { readCounts[r.message_id] = r.cnt; });

        const replyIds = [...new Set(rawMessages.map(m => m.replyTo).filter(Boolean))];
        if (replyIds.length > 0) {
            const rph = replyIds.map(() => '?').join(',');
            const { results: replyRows } = await c.env.DB.prepare(
                `SELECT m.id, m.text, u.name as sender_name
                 FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id IN (${rph})`
            ).bind(...replyIds).all();
            replyRows.forEach(r => { replyMap[r.id] = r; });
        }
    }

    const formatted = orderedMessages.map(m => {
        const reply = m.replyTo ? replyMap[m.replyTo] : null;
        return {
            _id: m._id,
            text: m.text,
            createdAt: m.createdAt,
            sender: { _id: m.sender_id, name: m.sender_name, email: m.sender_email, photo: m.sender_photo },
            replyTo: reply ? {
                _id: reply.id,
                text: reply.text,
                senderName: reply.sender_name
            } : null,
            deliveredCount: deliveredCounts[m._id] || 0,
            readCount: readCounts[m._id] || 0,
            totalRecipients
        };
    });

    const { results: typingRows } = await c.env.DB.prepare(
        `SELECT ts.user_id, u.name FROM typing_status ts JOIN users u ON ts.user_id = u.id
         WHERE ts.conversation_id = ? AND ts.user_id != ? AND ts.typingUntil > ?`
    ).bind(id, user.id, new Date().toISOString()).all();

    return c.json({
        conversation,
        messages: formatted,
        hasMore,
        typingUsers: typingRows.map(t => ({ _id: t.user_id, name: t.name }))
    });
});

// Send a message in a conversation (optionally replying to another)
app.post('/conversations/:id/messages', authMiddleware, async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const membership = await c.env.DB.prepare(
        'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).bind(id, user.id).first();
    if (!membership) return c.json({ msg: 'Access denied' }, 403);

    const { text, replyTo } = await c.req.json();
    if (!text || !text.trim()) return c.json({ msg: 'Message text is required' }, 400);
    if (text.trim().length > 4000) return c.json({ msg: 'Message is too long (max 4000 characters)' }, 400);

    let replyToId = null;
    if (replyTo) {
        const original = await c.env.DB.prepare('SELECT id FROM messages WHERE id = ? AND conversation_id = ?').bind(replyTo, id).first();
        if (!original) return c.json({ msg: 'Message being replied to was not found in this conversation' }, 400);
        replyToId = original.id;
    }

    const messageId = crypto.randomUUID();
    const now = new Date().toISOString();
    await c.env.DB.prepare(
        'INSERT INTO messages (id, conversation_id, sender_id, text, replyTo, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(messageId, id, user.id, text.trim(), replyToId, now).run();
    await c.env.DB.prepare('INSERT OR IGNORE INTO message_reads (message_id, user_id) VALUES (?, ?)')
        .bind(messageId, user.id).run();
    await c.env.DB.prepare('INSERT OR IGNORE INTO message_delivered (message_id, user_id) VALUES (?, ?)')
        .bind(messageId, user.id).run();
    await c.env.DB.prepare('UPDATE conversations SET lastMessageAt = ? WHERE id = ?').bind(now, id).run();
    await c.env.DB.prepare('DELETE FROM typing_status WHERE conversation_id = ? AND user_id = ?').bind(id, user.id).run();

    // NOTE: intentionally no push-notification step here. The Express side
    // sends FCM pushes via firebase-admin, which doesn't run in the Workers
    // runtime, and this Worker never had announcements/FCM wiring to begin
    // with. Browser notifications (added client-side) cover the "app open
    // in another tab" case identically on both backends; background push
    // parity for the Cloudflare deployment is a known follow-up, not
    // something silently dropped.

    const sender = await c.env.DB.prepare('SELECT id, name, email, photo FROM users WHERE id = ?').bind(user.id).first();
    const participantCount = await c.env.DB.prepare(
        'SELECT COUNT(*) as cnt FROM conversation_participants WHERE conversation_id = ?'
    ).bind(id).first();

    let replyPreview = null;
    if (replyToId) {
        const reply = await c.env.DB.prepare(
            `SELECT m.id, m.text, u.name as sender_name
             FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`
        ).bind(replyToId).first();
        if (reply) {
            replyPreview = {
                _id: reply.id,
                text: reply.text,
                senderName: reply.sender_name
            };
        }
    }

    return c.json({
        _id: messageId,
        text: text.trim(),
        createdAt: now,
        sender: { _id: sender.id, name: sender.name, email: sender.email, photo: sender.photo },
        replyTo: replyPreview,
        deliveredCount: 0,
        readCount: 0,
        totalRecipients: participantCount.cnt - 1
    }, 201);
});

export default app;
