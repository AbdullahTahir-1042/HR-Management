const express = require('express');
const router = express.Router();
const OnboardingTask = require('../models/OnboardingTask');
const { auth, isHR } = require('../middleware/auth');

// @route   GET api/onboarding/tasks
// @desc    Get all onboarding tasks
// @access  Private
router.get('/tasks', auth, async (req, res) => {
    try {
        const tasks = await OnboardingTask.find().sort({ createdAt: 1 });
        res.json(tasks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/onboarding/tasks
// @desc    Create an onboarding task (HR only)
// @access  Private (HR only)
router.post('/tasks', [auth, isHR], async (req, res) => {
    const { title, description, category, link } = req.body;
    try {
        const newTask = new OnboardingTask({
            title,
            description,
            category: category || 'General',
            link: link || ''
        });
        const task = await newTask.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/onboarding/tasks/:id
// @desc    Update onboarding task (HR only)
// @access  Private (HR only)
router.put('/tasks/:id', [auth, isHR], async (req, res) => {
    const { title, description, category, link } = req.body;
    try {
        let task = await OnboardingTask.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (category !== undefined) task.category = category;
        if (link !== undefined) task.link = link;

        await task.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/onboarding/tasks/:id
// @desc    Delete onboarding task (HR only)
// @access  Private (HR only)
router.delete('/tasks/:id', [auth, isHR], async (req, res) => {
    try {
        const task = await OnboardingTask.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        await OnboardingTask.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Task removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/onboarding/tasks/:id/toggle
// @desc    Toggle completion of onboarding task for the current user
// @access  Private
router.post('/tasks/:id/toggle', auth, async (req, res) => {
    try {
        const task = await OnboardingTask.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        const userId = req.user.id;
        const index = task.completedBy.indexOf(userId);

        if (index > -1) {
            // Task already completed, unmark it
            task.completedBy.splice(index, 1);
        } else {
            // Mark task as completed
            task.completedBy.push(userId);
        }

        await task.save();
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
