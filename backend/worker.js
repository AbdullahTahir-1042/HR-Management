import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { sign, verify } from 'hono/jwt';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

const app = new Hono().basePath('/api');

// Enable CORS
app.use('*', cors());

app.onError((err, c) => {
    console.error("Hono Worker Error:", err);
    return c.json({ msg: err.message, stack: err.stack }, 500);
});

// MongoDB client connection pool cache
let mongoClient = null;
const getDb = async (c) => {
    if (mongoClient) {
        try {
            await mongoClient.db('hr-management').command({ ping: 1 });
        } catch (e) {
            try {
                await mongoClient.close();
            } catch (err) {}
            mongoClient = null;
        }
    }

    if (!mongoClient) {
        let uri = c.env.MONGODB_URI;
        if (uri.includes('cluster0.vgojld9.mongodb.net')) {
            const authPart = uri.split('@')[0].replace('mongodb+srv://', '');
            uri = `mongodb://${authPart}@ac-t55ayns-shard-00-00.vgojld9.mongodb.net:27017,ac-t55ayns-shard-00-01.vgojld9.mongodb.net:27017,ac-t55ayns-shard-00-02.vgojld9.mongodb.net:27017/?ssl=true&replicaSet=atlas-c1l74f-shard-0&authSource=admin&retryWrites=false`;
        }

        mongoClient = new MongoClient(uri, {
            maxPoolSize: 1,
            minPoolSize: 0,
            heartbeatFrequencyMS: 3600000,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 30000
        });
        await mongoClient.connect();
    }
    return mongoClient.db('hr-management');
};

// Authentication Middleware
const authMiddleware = async (c, next) => {
    const token = c.req.header('x-auth-token');
    if (!token) {
        return c.json({ msg: 'No token, authorization denied' }, 401);
    }
    try {
        const decoded = await verify(token, c.env.JWT_SECRET, 'HS256');
        c.set('user', decoded.user);
        await next();
    } catch (err) {
        return c.json({ msg: 'Token is not valid' }, 401);
    }
};

// HR Authorization Middleware
const isHRMiddleware = async (c, next) => {
    const user = c.get('user');
    const db = await getDb(c);
    try {
        const dbUser = await db.collection('users').findOne({ id: user.id });
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
    const userCount = await db.collection('users').countDocuments({ isDeleted: { $ne: true } });
    if (userCount === 0) {
        const adminId = crypto.randomUUID();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await db.collection('users').insertOne({
            _id: adminId,
            id: adminId,
            name: 'HR Administrator',
            email: 'admin@hr.com',
            password: hashedPassword,
            role: 'hr',
            salary: 100000,
            department: 'hr',
            createdAt: new Date().toISOString()
        });
    }

    const typeCount = await db.collection('leave_types').countDocuments();
    if (typeCount === 0) {
        await db.collection('leave_types').insertMany([
            { _id: crypto.randomUUID(), name: 'Annual Leave', quota: 20, description: 'Yearly allocated vacations' },
            { _id: crypto.randomUUID(), name: 'Sick Leave', quota: 10, description: 'Medical absence leaves' },
            { _id: crypto.randomUUID(), name: 'Casual Leave', quota: 10, description: 'Urgent casual absences' }
        ]);
    }

    const deptCount = await db.collection('departments').countDocuments({ isDeleted: { $ne: true } });
    if (deptCount === 0) {
        await db.collection('departments').insertMany([
            { _id: crypto.randomUUID(), name: 'development', description: 'Software engineering and coding department', isDeleted: false },
            { _id: crypto.randomUUID(), name: 'design', description: 'UI/UX design and marketing assets', isDeleted: false },
            { _id: crypto.randomUUID(), name: 'hr', description: 'Human Resources and management', isDeleted: false },
            { _id: crypto.randomUUID(), name: 'QA', description: 'Quality Assurance and software testing', isDeleted: false }
        ]);
    }
};

// Hook to seed on requests
app.use('*', async (c, next) => {
    const db = await getDb(c);
    await seedDBIfEmpty(db);
    await next();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. AUTHENTICATION & USERS CRUD
// ─────────────────────────────────────────────────────────────────────────────

// Login
app.post('/auth/login', async (c) => {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ msg: 'Please enter all fields' }, 400);

    const db = await getDb(c);
    const normEmail = email.toLowerCase();
    const user = await db.collection('users').findOne({ email: normEmail, isDeleted: { $ne: true } });
    if (!user) return c.json({ msg: 'Invalid Credentials' }, 400);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return c.json({ msg: 'Invalid Credentials' }, 400);

    const payload = {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
    };
    const token = await sign(payload, c.env.JWT_SECRET, 'HS256');
    return c.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// Get current user details
app.get('/auth/user', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = await getDb(c);
    const dbUser = await db.collection('users').findOne({ id: user.id });
    return c.json(dbUser);
});

// Register user (HR only)
app.post('/auth/register', authMiddleware, isHRMiddleware, async (c) => {
    const body = await c.req.json();
    const { name, email, password, role, status, salary, photo, department, reportingTo, phone } = body;
    if (!name || !email || !password) return c.json({ msg: 'Please enter all required fields' }, 400);

    const db = await getDb(c);
    const normEmail = email.toLowerCase();
    const existing = await db.collection('users').findOne({ email: normEmail });
    if (existing) return c.json({ msg: 'User already exists' }, 400);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();

    const newUser = {
        _id: userId,
        id: userId,
        name,
        email: normEmail,
        password: hashedPassword,
        role: role || 'employee',
        status: status || 'full time',
        salary: salary || 0,
        photo: photo || '',
        department: department || 'development',
        reportingTo: reportingTo || '',
        phone: phone || '',
        isDeleted: false,
        createdAt: new Date().toISOString()
    };

    await db.collection('users').insertOne(newUser);
    return c.json({ msg: 'User registered successfully', user: { id: userId, name, email: normEmail, role } });
});

// Get all users (HR only)
app.get('/auth/users', authMiddleware, isHRMiddleware, async (c) => {
    const db = await getDb(c);
    const users = await db.collection('users')
        .find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .toArray();
    return c.json(users);
});

// Update user details (Self or HR)
app.put('/auth/users/:id', authMiddleware, async (c) => {
    const reqUser = c.get('user');
    const paramId = c.req.param('id');
    const body = await c.req.json();
    const { name, email, role, status, salary, photo, department, reportingTo, phone, password } = body;

    const db = await getDb(c);
    const isSelf = reqUser.id === paramId;
    const adminUser = await db.collection('users').findOne({ id: reqUser.id });
    const isHR = adminUser && adminUser.role === 'hr';

    if (!isSelf && !isHR) {
        return c.json({ msg: 'Access denied. You can only update your own profile.' }, 403);
    }

    const user = await db.collection('users').findOne({ id: paramId });
    if (!user) return c.json({ msg: 'User not found' }, 404);

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email.toLowerCase();
    if (photo !== undefined) updateFields.photo = photo;
    if (phone !== undefined) updateFields.phone = phone;

    if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        updateFields.password = hashedPassword;
    }

    if (isHR) {
        if (role !== undefined) updateFields.role = role;
        if (status !== undefined) updateFields.status = status;
        if (salary !== undefined) updateFields.salary = salary;
        if (department !== undefined) updateFields.department = department;
        if (reportingTo !== undefined) updateFields.reportingTo = reportingTo;
    }

    if (Object.keys(updateFields).length === 0) {
        return c.json({ msg: 'No fields to update' }, 400);
    }

    await db.collection('users').updateOne({ id: paramId }, { $set: updateFields });
    return c.json({ msg: 'Profile updated successfully' });
});

// Delete user (Soft Delete) (HR only)
app.delete('/auth/users/:id', authMiddleware, isHRMiddleware, async (c) => {
    const paramId = c.req.param('id');
    const reqUser = c.get('user');
    const db = await getDb(c);

    if (reqUser.id === paramId) {
        return c.json({ msg: 'You cannot delete your own account' }, 400);
    }

    await db.collection('users').updateOne({ id: paramId }, { $set: { isDeleted: true } });
    return c.json({ msg: 'User soft-deleted successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. ATTENDANCE API
// ─────────────────────────────────────────────────────────────────────────────

// Check-in
app.post('/attendance/check-in', authMiddleware, async (c) => {
    const user = c.get('user');
    const today = new Date().toISOString().split('T')[0];
    const db = await getDb(c);

    const existing = await db.collection('attendance').findOne({ employee_id: user.id, date: today });
    if (existing) return c.json({ msg: 'Already checked in today' }, 400);

    const attId = crypto.randomUUID();
    const nowStr = new Date().toISOString();

    const attRecord = {
        _id: attId,
        id: attId,
        employee_id: user.id,
        date: today,
        checkIn: nowStr,
        checkOut: null
    };

    await db.collection('attendance').insertOne(attRecord);
    return c.json(attRecord);
});

// Check-out
app.post('/attendance/check-out', authMiddleware, async (c) => {
    const user = c.get('user');
    const today = new Date().toISOString().split('T')[0];
    const db = await getDb(c);

    const att = await db.collection('attendance').findOne({ employee_id: user.id, date: today });
    if (!att) return c.json({ msg: 'Must check in first' }, 400);
    if (att.checkOut) return c.json({ msg: 'Already checked out today' }, 400);

    const nowStr = new Date().toISOString();
    await db.collection('attendance').updateOne({ id: att.id }, { $set: { checkOut: nowStr } });

    return c.json({ ...att, checkOut: nowStr });
});

// Status today
app.get('/attendance/status', authMiddleware, async (c) => {
    const user = c.get('user');
    const today = new Date().toISOString().split('T')[0];
    const db = await getDb(c);
    const att = await db.collection('attendance').findOne({ employee_id: user.id, date: today });
    return c.json(att || null);
});

// User's own history
app.get('/attendance/my-history', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = await getDb(c);
    const results = await db.collection('attendance')
        .find({ employee_id: user.id })
        .sort({ date: -1 })
        .toArray();
    return c.json(results);
});

// All history (HR only)
app.get('/attendance/all', authMiddleware, isHRMiddleware, async (c) => {
    const db = await getDb(c);
    const attLogs = await db.collection('attendance').find().sort({ date: -1 }).toArray();
    const userIds = attLogs.map(a => a.employee_id);
    const users = await db.collection('users').find({ id: { $in: userIds } }).toArray();

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const formatted = attLogs.map(a => {
        const u = userMap[a.employee_id] || {};
        return {
            _id: a.id,
            date: a.date,
            checkIn: a.checkIn,
            checkOut: a.checkOut,
            employee: { name: u.name || '', email: u.email || '' }
        };
    });
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

    const db = await getDb(c);
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const diffTime = Math.abs(endD - startD);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Validate type
    const leaveType = await db.collection('leave_types').findOne({ _id: leaveTypeId });
    if (!leaveType) return c.json({ msg: 'Invalid leave type' }, 400);

    // Dynamic balance calculations
    const currentYear = new Date().getFullYear();
    const approvedLeaves = await db.collection('leave_requests')
        .find({ employee_id: user.id, leave_type_id: leaveTypeId, status: 'approved' })
        .toArray();

    let usedDays = 0;
    approvedLeaves.forEach(l => {
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
    await db.collection('leave_requests').insertOne({
        _id: leaveId,
        id: leaveId,
        employee_id: user.id,
        leave_type_id: leaveTypeId,
        startDate,
        endDate,
        reason: reason || '',
        status: 'pending',
        createdAt: new Date().toISOString()
    });

    return c.json({ msg: 'Leave applied successfully' });
});

// Dynamic balances
app.get('/leaves/balances', authMiddleware, async (c) => {
    const user = c.get('user');
    const currentYear = new Date().getFullYear();
    const db = await getDb(c);

    const types = await db.collection('leave_types').find().toArray();
    const approved = await db.collection('leave_requests')
        .find({ employee_id: user.id, status: 'approved' })
        .toArray();

    const usedMap = {};
    approved.forEach(l => {
        const s = new Date(l.startDate);
        const e = new Date(l.endDate);
        if (s.getFullYear() === currentYear) {
            const diff = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
            usedMap[l.leave_type_id] = (usedMap[l.leave_type_id] || 0) + diff;
        }
    });

    const balances = types.map(t => {
        const used = usedMap[t._id] || 0;
        return {
            leaveType: { _id: t._id, name: t.name, quota: t.quota },
            allocated: t.quota,
            used,
            remaining: Math.max(0, t.quota - used)
        };
    });

    return c.json(balances);
});

// Leave configurations CRUD
app.get('/leaves/types', authMiddleware, async (c) => {
    const db = await getDb(c);
    const results = await db.collection('leave_types').find().toArray();
    return c.json(results);
});

app.post('/leaves/types', authMiddleware, isHRMiddleware, async (c) => {
    const { name, quota, description } = await c.req.json();
    if (!name || quota === undefined) return c.json({ msg: 'Name and quota are required' }, 400);

    const db = await getDb(c);
    const existing = await db.collection('leave_types').findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) return c.json({ msg: 'Leave type already exists' }, 400);

    const typeId = crypto.randomUUID();
    await db.collection('leave_types').insertOne({
        _id: typeId,
        name,
        quota,
        description: description || ''
    });

    return c.json({ _id: typeId, name, quota, description });
});

app.put('/leaves/types/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { name, quota, description } = await c.req.json();

    const db = await getDb(c);
    const existing = await db.collection('leave_types').findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
    });
    if (existing) return c.json({ msg: 'Another leave type with this name exists' }, 400);

    await db.collection('leave_types').updateOne(
        { _id: id },
        { $set: { name, quota, description: description || '' } }
    );

    return c.json({ msg: 'Leave type updated' });
});

app.delete('/leaves/types/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const db = await getDb(c);

    const link = await db.collection('leave_requests').findOne({ leave_type_id: id });
    if (link) {
        return c.json({ msg: 'Cannot delete leave type because there are associated leave requests.' }, 400);
    }
    await db.collection('leave_types').deleteOne({ _id: id });
    return c.json({ msg: 'Leave type deleted successfully' });
});

// Employee's own leaves
app.get('/leaves/my-leaves', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = await getDb(c);

    const requests = await db.collection('leave_requests')
        .find({ employee_id: user.id })
        .sort({ startDate: -1 })
        .toArray();

    const typeIds = requests.map(r => r.leave_type_id);
    const types = await db.collection('leave_types').find({ _id: { $in: typeIds } }).toArray();
    const typeMap = {};
    types.forEach(t => { typeMap[t._id] = t; });

    const formatted = requests.map(r => ({
        _id: r._id,
        startDate: r.startDate,
        endDate: r.endDate,
        reason: r.reason,
        status: r.status,
        leaveType: { name: (typeMap[r.leave_type_id] || {}).name || 'Annual Leave' }
    }));
    return c.json(formatted);
});

// All requests (HR only)
app.get('/leaves/all', authMiddleware, isHRMiddleware, async (c) => {
    const db = await getDb(c);
    const requests = await db.collection('leave_requests').find().sort({ startDate: -1 }).toArray();

    const empIds = requests.map(r => r.employee_id);
    const typeIds = requests.map(r => r.leave_type_id);

    const [users, types] = await Promise.all([
        db.collection('users').find({ id: { $in: empIds } }).toArray(),
        db.collection('leave_types').find({ _id: { $in: typeIds } }).toArray()
    ]);

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const typeMap = {};
    types.forEach(t => { typeMap[t._id] = t; });

    const formatted = requests.map(r => {
        const u = userMap[r.employee_id] || {};
        const t = typeMap[r.leave_type_id] || {};
        return {
            _id: r._id,
            startDate: r.startDate,
            endDate: r.endDate,
            reason: r.reason,
            status: r.status,
            employee: { _id: u.id, name: u.name, email: u.email },
            leaveType: { name: t.name || 'Annual Leave' }
        };
    });
    return c.json(formatted);
});

// Approve/Reject leave
app.put('/leaves/:id/status', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    const db = await getDb(c);

    const req = await db.collection('leave_requests').findOne({ _id: id });
    if (!req) return c.json({ msg: 'Leave request not found' }, 404);

    if (status === 'approved') {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        const reqDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
        const currentYear = start.getFullYear();

        const leaveType = await db.collection('leave_types').findOne({ _id: req.leave_type_id });
        if (leaveType) {
            const approved = await db.collection('leave_requests')
                .find({ employee_id: req.employee_id, leave_type_id: req.leave_type_id, status: 'approved', _id: { $ne: id } })
                .toArray();

            let used = 0;
            approved.forEach(l => {
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

    await db.collection('leave_requests').updateOne({ _id: id }, { $set: { status } });
    return c.json({ msg: 'Status updated successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. HOLIDAYS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/holidays', authMiddleware, async (c) => {
    const db = await getDb(c);
    const results = await db.collection('holidays').find().sort({ startDate: 1 }).toArray();
    return c.json(results);
});

app.post('/holidays', authMiddleware, isHRMiddleware, async (c) => {
    const { name, startDate, endDate, description, type } = await c.req.json();
    if (!name || !startDate || !endDate) return c.json({ msg: 'Missing fields' }, 400);

    const db = await getDb(c);
    const holidayId = crypto.randomUUID();
    const newHoliday = {
        _id: holidayId,
        name,
        startDate,
        endDate,
        description: description || '',
        type: type || 'public'
    };

    await db.collection('holidays').insertOne(newHoliday);
    return c.json(newHoliday);
});

app.put('/holidays/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { name, startDate, endDate, description, type } = await c.req.json();
    const db = await getDb(c);

    await db.collection('holidays').updateOne(
        { _id: id },
        { $set: { name, startDate, endDate, description: description || '', type: type || 'public' } }
    );
    return c.json({ msg: 'Holiday updated' });
});

app.delete('/holidays/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const db = await getDb(c);
    await db.collection('holidays').deleteOne({ _id: id });
    return c.json({ msg: 'Holiday deleted successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ONBOARDING & TASKS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/onboarding/tasks', authMiddleware, async (c) => {
    const db = await getDb(c);
    const tasks = await db.collection('onboarding_tasks').find().toArray();
    const completions = await db.collection('onboarding_task_completions').find().toArray();

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

    const db = await getDb(c);
    const taskId = crypto.randomUUID();
    const newTask = {
        _id: taskId,
        title,
        description: description || '',
        category: category || 'General',
        link: link || '',
        createdAt: new Date().toISOString()
    };

    await db.collection('onboarding_tasks').insertOne(newTask);
    return c.json({ ...newTask, completedBy: [] });
});

app.put('/onboarding/tasks/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { title, description, category, link } = await c.req.json();
    const db = await getDb(c);

    await db.collection('onboarding_tasks').updateOne(
        { _id: id },
        { $set: { title, description: description || '', category: category || 'General', link: link || '' } }
    );
    return c.json({ msg: 'Task updated' });
});

app.delete('/onboarding/tasks/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const db = await getDb(c);
    await db.collection('onboarding_tasks').deleteOne({ _id: id });
    await db.collection('onboarding_task_completions').deleteMany({ task_id: id });
    return c.json({ msg: 'Task removed' });
});

app.post('/onboarding/tasks/:id/toggle', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const db = await getDb(c);

    const task = await db.collection('onboarding_tasks').findOne({ _id: id });
    if (!task) return c.json({ msg: 'Task not found' }, 404);

    const existing = await db.collection('onboarding_task_completions').findOne({ task_id: id, user_id: user.id });
    if (existing) {
        await db.collection('onboarding_task_completions').deleteOne({ task_id: id, user_id: user.id });
    } else {
        await db.collection('onboarding_task_completions').insertOne({
            task_id: id,
            user_id: user.id
        });
    }

    const results = await db.collection('onboarding_task_completions').find({ task_id: id }).toArray();
    return c.json({ _id: id, completedBy: results.map(r => r.user_id) });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. PRACTICE & PROVIDERS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/practice/info', authMiddleware, async (c) => {
    const db = await getDb(c);
    const info = await db.collection('practice_infos').findOne({});
    return c.json(info || null);
});

app.post('/practice/info', authMiddleware, async (c) => {
    const { name, phone, email, taxId, npi, address, onboardingStep } = await c.req.json();
    if (!name) return c.json({ msg: 'Name is required' }, 400);

    const db = await getDb(c);
    const existing = await db.collection('practice_infos').findOne({});

    if (existing) {
        const updateData = { name, phone: phone || '', email: email || '', taxId: taxId || '', npi: npi || '', address: address || '', onboardingStep: onboardingStep || 1 };
        await db.collection('practice_infos').updateOne({ _id: existing._id }, { $set: updateData });
        return c.json({ _id: existing._id, ...updateData });
    } else {
        const id = crypto.randomUUID();
        const newData = { _id: id, name, phone: phone || '', email: email || '', taxId: taxId || '', npi: npi || '', address: address || '', onboardingStep: onboardingStep || 1 };
        await db.collection('practice_infos').insertOne(newData);
        return c.json(newData);
    }
});

app.get('/practice/providers', authMiddleware, async (c) => {
    const db = await getDb(c);
    const results = await db.collection('practice_providers').find().toArray();
    return c.json(results);
});

app.post('/practice/providers', authMiddleware, async (c) => {
    const { name, npi, taxonomy, licenseNumber, practiceId } = await c.req.json();
    if (!name) return c.json({ msg: 'Name is required' }, 400);

    const db = await getDb(c);
    const providerId = crypto.randomUUID();
    const newProvider = {
        _id: providerId,
        practice_id: practiceId || '',
        name,
        npi: npi || '',
        taxonomy: taxonomy || '',
        licenseNumber: licenseNumber || ''
    };
    await db.collection('practice_providers').insertOne(newProvider);
    return c.json(newProvider);
});

app.delete('/practice/providers/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const db = await getDb(c);
    await db.collection('practice_providers').deleteOne({ _id: id });
    return c.json({ msg: 'Provider deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. HR REQUESTS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/hr-requests', authMiddleware, isHRMiddleware, async (c) => {
    const db = await getDb(c);
    const requests = await db.collection('hr_requests').find().sort({ createdAt: -1 }).toArray();

    const empIds = requests.map(r => r.employee_id);
    const users = await db.collection('users').find({ id: { $in: empIds } }).toArray();
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const formatted = requests.map(r => {
        const u = userMap[r.employee_id] || {};
        return {
            _id: r._id,
            subject: r.subject,
            description: r.description,
            status: r.status,
            hrNote: r.hrNote,
            createdAt: r.createdAt,
            employee: { _id: u.id, name: u.name, email: u.email }
        };
    });
    return c.json(formatted);
});

app.get('/hr-requests/my-requests', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = await getDb(c);
    const results = await db.collection('hr_requests')
        .find({ employee_id: user.id })
        .sort({ createdAt: -1 })
        .toArray();
    return c.json(results);
});

app.post('/hr-requests', authMiddleware, async (c) => {
    const user = c.get('user');
    const { subject, description } = await c.req.json();
    if (!subject || !description) return c.json({ msg: 'Subject and description are required' }, 400);

    const db = await getDb(c);
    const requestId = crypto.randomUUID();
    await db.collection('hr_requests').insertOne({
        _id: requestId,
        employee_id: user.id,
        subject,
        description,
        status: 'pending',
        createdAt: new Date().toISOString()
    });

    return c.json({ msg: 'Request submitted successfully' });
});

app.put('/hr-requests/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { status, hrNote } = await c.req.json();
    const db = await getDb(c);

    await db.collection('hr_requests').updateOne(
        { _id: id },
        { $set: { status, hrNote: hrNote || '' } }
    );
    return c.json({ msg: 'Request updated' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. DEPARTMENTS CRUD & REPORTS API
// ─────────────────────────────────────────────────────────────────────────────

app.get('/departments/all', authMiddleware, async (c) => {
    const db = await getDb(c);
    const results = await db.collection('departments')
        .find({ isDeleted: { $ne: true } })
        .sort({ name: 1 })
        .toArray();
    return c.json(results);
});

app.post('/departments/add', authMiddleware, isHRMiddleware, async (c) => {
    const { name, description } = await c.req.json();
    if (!name) return c.json({ msg: 'Department name is required' }, 400);

    const db = await getDb(c);
    const existing = await db.collection('departments').findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        isDeleted: { $ne: true }
    });
    if (existing) {
        return c.json({ msg: 'Department with this name already exists' }, 400);
    }

    const deptId = crypto.randomUUID();
    await db.collection('departments').insertOne({
        _id: deptId,
        name,
        description: description || '',
        isDeleted: false
    });

    return c.json({ msg: 'Department created successfully', dept: { _id: deptId, name, description } });
});

app.put('/departments/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const { name, description } = await c.req.json();
    if (!name) return c.json({ msg: 'Department name is required' }, 400);

    const db = await getDb(c);
    const existing = await db.collection('departments').findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        isDeleted: { $ne: true },
        _id: { $ne: id }
    });
    if (existing) {
        return c.json({ msg: 'Department with this name already exists' }, 400);
    }

    await db.collection('departments').updateOne(
        { _id: id },
        { $set: { name, description: description || '' } }
    );

    return c.json({ msg: 'Department updated successfully', dept: { _id: id, name, description } });
});

app.delete('/departments/:id', authMiddleware, isHRMiddleware, async (c) => {
    const id = c.req.param('id');
    const db = await getDb(c);

    const dept = await db.collection('departments').findOne({ _id: id });
    if (!dept) return c.json({ msg: 'Department not found' }, 404);

    const employeeInDept = await db.collection('users').findOne({
        department: { $regex: new RegExp(`^${dept.name}$`, 'i') },
        isDeleted: { $ne: true }
    });
    if (employeeInDept) {
        return c.json({ msg: 'Cannot delete! Employees are assigned to this department.' }, 400);
    }

    await db.collection('departments').updateOne({ _id: id }, { $set: { isDeleted: true } });
    return c.json({ msg: 'Department deleted successfully' });
});

app.get('/attendance/report', authMiddleware, isHRMiddleware, async (c) => {
    try {
        const db = await getDb(c);
        const type = c.req.query('type');
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');
        const employeeId = c.req.query('employeeId');

        if (type === 'leave') {
            const query = {};
            if (employeeId) query.employee_id = employeeId;
            if (startDate || endDate) {
                if (startDate) query.startDate = { ...query.startDate, $gte: startDate };
                if (endDate) query.endDate = { ...query.endDate, $lte: endDate };
            }

            const requests = await db.collection('leave_requests')
                .find(query)
                .sort({ createdAt: -1 })
                .toArray();

            const empIds = requests.map(r => r.employee_id);
            const typeIds = requests.map(r => r.leave_type_id);

            const [users, types] = await Promise.all([
                db.collection('users').find({ id: { $in: empIds } }).toArray(),
                db.collection('leave_types').find({ _id: { $in: typeIds } }).toArray()
            ]);

            const userMap = {};
            users.forEach(u => { userMap[u.id] = u; });

            const typeMap = {};
            types.forEach(t => { typeMap[t._id] = t; });

            const formatted = requests.map(r => {
                const u = userMap[r.employee_id] || {};
                const t = typeMap[r.leave_type_id] || {};
                return {
                    _id: r._id,
                    startDate: r.startDate,
                    endDate: r.endDate,
                    reason: r.reason,
                    status: r.status,
                    createdAt: r.createdAt,
                    leaveType: { name: t.name || 'Annual Leave' },
                    employee: { 
                        _id: u.id, 
                        name: u.name, 
                        email: u.email, 
                        department: u.department 
                    }
                };
            });

            return c.json(formatted);
        }

        const query = {};
        if (employeeId) query.employee_id = employeeId;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const logs = await db.collection('attendance')
            .find(query)
            .sort({ date: -1 })
            .toArray();

        const empIds = logs.map(l => l.employee_id);
        const users = await db.collection('users').find({ id: { $in: empIds } }).toArray();

        const userMap = {};
        users.forEach(u => { userMap[u.id] = u; });

        const formatted = logs.map(l => {
            const u = userMap[l.employee_id] || {};
            return {
                _id: l._id,
                date: l.date,
                checkIn: l.checkIn,
                checkOut: l.checkOut,
                employee: { 
                    _id: u.id, 
                    name: u.name, 
                    email: u.email, 
                    department: u.department 
                }
            };
        });

        return c.json(formatted);
    } catch (err) {
        console.error("Error generating report:", err);
        return c.json({ msg: 'Server error' }, 500);
    }
});

export default app;
