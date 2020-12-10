const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');
const router = new express.Router();

// Create a new task
router.post('/tasks', auth, async (req, res) => {
    // Check when a task is created, it's associated with the person who is authenticated.

    const task = new Task({ // We want all of req.body plus an owner. (before authentication it was just new Task(req.body)).
        ...req.body, // This will copy all of the properties from body. (ES6 Spread operator)
        owner: req.user._id // req.user is added to the request from the middleware.
    })

    try { 
        await task.save();
        res.status(201).send(task);
    } catch {
        res.status(400).send();
    }
});

// Get all tasks
router.get('/tasks', auth, async (req, res) => {
    const match = {};
    const sort = {};

        // If there is a completed field on the query string, set the match variable to true if completed is the string 'true'. If not, set it to false.
    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1; // createdAt propery (that we set in the query string) on the sortBy object set to -1 is string true or 1 if string false.
    }

    try {
        // Populate the virtual field 'tasks' with the Task collection, where the _id of the user (localfield) corresponds to the _id in the owner field of Task.
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit), // parseInt parses a string with a number into a Number.
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate(); 

        res.send(req.user.tasks);
    } catch (e) {
        res.status(500).send();
    }
});

// Get task by ID
router.get('/tasks/:id', auth, async(req, res) => {
    const _id = req.params.id;

    try {
        // We filter by the _id of the task (that was searched for), and the owner field in the Task model corresponds to the authenticaed req.user._id.
        const task = await Task.findOne({ _id, owner: req.user._id }); 

        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (e) {
        console.log(e)
        res.status(500).send()
    }
});

// Update task by ID
router.patch('/tasks/:id', auth, async(req, res) => {
    const allowedUpdates = ['description', 'completed'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        res.status(400).send({error: 'Invalid updates!'})
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id  });

        if (!task) {
            return res.status(404).send();
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save();

        res.send(task)
    } catch (e) {
        console.log(e)
        res.status(400).send()
    }
});

// Delete task by ID
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send();
        }

        res.send(task)
    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;