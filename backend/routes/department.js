const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const User = require('../models/User');
const { auth, isHR } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────
// GET /api/departments
// Get all departments with populated teamLead and employees (HR)
// ─────────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
    try {
        const departments = await Department.find({ isDeleted: false })
            .populate('teamLead', 'name email status')
            .populate('employees', 'name email status department');
        res.json(departments);
    } catch (err) {
        console.error('GET /departments error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/departments/my-department
// Employee gets their own department info (by departmentId on their profile)
// MUST be defined before /:id to avoid route conflict
// ─────────────────────────────────────────────────────────────────
router.get('/my-department', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user || !user.departmentId) {
            return res.status(404).json({ msg: 'You are not assigned to any department yet.' });
        }

        const dept = await Department.findById(user.departmentId)
            .populate('teamLead', 'name email status isTeamLead')
            .populate('employees', 'name email status department isTeamLead');

        if (!dept || dept.isDeleted) {
            return res.status(404).json({ msg: 'Department not found.' });
        }

        res.json(dept);
    } catch (err) {
        console.error('GET /my-department error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/departments
// Create a new department (HR only)
// Body: { name, description, employeeIds[], teamLeadId }
// ─────────────────────────────────────────────────────────────────
router.post('/', auth, isHR, async (req, res) => {
    try {
        const { name, description, employeeIds = [], teamLeadId } = req.body;

        // Duplicate name check (case-insensitive)
        const existing = await Department.findOne({ name, isDeleted: false })
            .collation({ locale: 'en', strength: 2 });
        if (existing) {
            return res.status(400).json({ msg: 'Department with this name already exists' });
        }

        const dept = new Department({
            name,
            description,
            employees: employeeIds,
            teamLead: teamLeadId || null
        });
        await dept.save();

        // Update each employee's departmentId
        if (employeeIds.length > 0) {
            await User.updateMany(
                { _id: { $in: employeeIds } },
                { $set: { departmentId: dept._id } }
            );
            // Pull these employees from all other departments
            await Department.updateMany(
                { _id: { $ne: dept._id } },
                { $pull: { employees: { $in: employeeIds } } }
            );
        }

        // Set isTeamLead flag on the chosen team lead
        if (teamLeadId) {
            await User.findByIdAndUpdate(teamLeadId, { isTeamLead: true, departmentId: dept._id });
            // Clear their lead ref from any other departments
            await Department.updateMany(
                { _id: { $ne: dept._id }, teamLead: teamLeadId },
                { $set: { teamLead: null } }
            );
        }

        const populated = await Department.findById(dept._id)
            .populate('teamLead', 'name email status')
            .populate('employees', 'name email status department');

        res.status(201).json({ msg: 'Department created successfully', dept: populated });
    } catch (err) {
        console.error('POST /departments error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/departments/:id
// Update department name / description (HR only)
// ─────────────────────────────────────────────────────────────────
router.put('/:id', auth, isHR, async (req, res) => {
    try {
        const { name, description, employeeIds, teamLeadId } = req.body;

        // Duplicate name check ignoring current dept
        if (name) {
            const existing = await Department.findOne({
                name,
                isDeleted: false,
                _id: { $ne: req.params.id }
            }).collation({ locale: 'en', strength: 2 });

            if (existing) {
                return res.status(400).json({ msg: 'Department with this name already exists' });
            }
        }

        const currentDept = await Department.findById(req.params.id);
        if (!currentDept) {
            return res.status(404).json({ msg: 'Department not found' });
        }

        const update = {};
        if (name !== undefined) update.name = name;
        if (description !== undefined) update.description = description;

        if (employeeIds !== undefined) {
            update.employees = employeeIds;

            // Find employees who were in the department but are now removed
            const previousEmployees = currentDept.employees || [];
            const removedEmployees = previousEmployees.filter(empId => !employeeIds.includes(empId.toString()));

            // Clear departmentId & isTeamLead for removed employees
            if (removedEmployees.length > 0) {
                await User.updateMany(
                    { _id: { $in: removedEmployees } },
                    { $set: { departmentId: null, isTeamLead: false } }
                );
            }

            // Set departmentId for the current list of employees
            if (employeeIds.length > 0) {
                await User.updateMany(
                    { _id: { $in: employeeIds } },
                    { $set: { departmentId: req.params.id } }
                );
                // Pull these employees from all other departments
                await Department.updateMany(
                    { _id: { $ne: req.params.id } },
                    { $pull: { employees: { $in: employeeIds } } }
                );
            }
        }

        // Handle teamLeadId update
        if (teamLeadId !== undefined) {
            const previousLeadId = currentDept.teamLead;
            update.teamLead = teamLeadId || null;

            // If the team lead changed
            if (previousLeadId && previousLeadId.toString() !== (teamLeadId || '')) {
                // Clear team lead flag for previous lead
                await User.findByIdAndUpdate(previousLeadId, { isTeamLead: false });
            }

            if (teamLeadId) {
                // Set team lead flag for new lead
                await User.findByIdAndUpdate(teamLeadId, { isTeamLead: true, departmentId: req.params.id });
                // Clear their lead ref from any other departments
                await Department.updateMany(
                    { _id: { $ne: req.params.id }, teamLead: teamLeadId },
                    { $set: { teamLead: null } }
                );
            }
        } else {
            // Clean up team lead if they are removed from the member list
            if (employeeIds !== undefined && currentDept.teamLead && !employeeIds.includes(currentDept.teamLead.toString())) {
                update.teamLead = null;
                await User.findByIdAndUpdate(currentDept.teamLead, { isTeamLead: false });
            }
        }

        const dept = await Department.findByIdAndUpdate(req.params.id, update, { new: true })
            .populate('teamLead', 'name email status')
            .populate('employees', 'name email status department');

        res.json({ msg: 'Department updated successfully', dept });
    } catch (err) {
        console.error('PUT /departments/:id error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/departments/:id/assign-teamlead
// Assign or change the team lead for a department (HR only)
// Body: { userId }
// ─────────────────────────────────────────────────────────────────
router.put('/:id/assign-teamlead', auth, isHR, async (req, res) => {
    try {
        const { userId } = req.body;
        const dept = await Department.findById(req.params.id);
        if (!dept || dept.isDeleted) {
            return res.status(404).json({ msg: 'Department not found' });
        }

        // Remove isTeamLead from previous lead (if different person)
        if (dept.teamLead && dept.teamLead.toString() !== userId) {
            await User.findByIdAndUpdate(dept.teamLead, { isTeamLead: false });
        }

        // Set new team lead
        dept.teamLead = userId;
        await dept.save();

        await User.findByIdAndUpdate(userId, {
            isTeamLead: true,
            departmentId: dept._id
        });

        // Clear their lead ref from any other departments
        await Department.updateMany(
            { _id: { $ne: dept._id }, teamLead: userId },
            { $set: { teamLead: null } }
        );

        const populated = await Department.findById(dept._id)
            .populate('teamLead', 'name email status')
            .populate('employees', 'name email status department');

        res.json({ msg: 'Team lead assigned successfully', dept: populated });
    } catch (err) {
        console.error('PUT /assign-teamlead error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// DELETE /api/departments/:id
// Soft-delete a department (HR only)
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', auth, isHR, async (req, res) => {
    try {
        const dept = await Department.findById(req.params.id);
        if (!dept) return res.status(404).json({ msg: 'Department not found' });

        if (dept.employees && dept.employees.length > 0) {
            return res.status(400).json({
                msg: 'Cannot delete! Employees are assigned to this department.'
            });
        }

        await Department.findByIdAndUpdate(req.params.id, { isDeleted: true });
        res.json({ msg: 'Department deleted successfully' });
    } catch (err) {
        console.error('DELETE /departments/:id error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;