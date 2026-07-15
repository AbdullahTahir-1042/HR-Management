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
        const decoded = await verify(token, c.env.JWT_SECRET || 'your_super_secret_jwt_key_123');
        c.set('user', decoded.user);
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

export default app;
