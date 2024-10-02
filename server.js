require('dotenv').config()
const express = require("express");
const path = require('path');
const { body, validationResult } = require('express-validator');
const myApp = express();

myApp.use(express.urlencoded({ extended: false }));
myApp.use(express.json());
myApp.set('views', path.join(__dirname, 'views'));
myApp.use(express.static('public'));
myApp.set('view engine', 'ejs');

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const mongoose = require('mongoose');
const { error } = require("console");
mongoose.connect(process.env.MONGODB_URI, {

});
const tasksSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    dueDate: {
        type: Date
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high']
    },
    completed: {
        type: Boolean,
        default: false
    }
})
const tasks = mongoose.model("tasks", tasksSchema);
const db = mongoose.connection
db.once('error', (error) => console.log('**Connection Error!' + error))
db.once('open', () => {
    console.log('**Connection established')
})

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);






myApp.get('/tasks', function (req, res) {
    tasks.find().then(function (task) {
        res.json(task);
    }).catch(function (err) {
        res.status(500).json({ error: "An error occurred while fetching tasks" });
        console.log(`DB Error: ${err}`);
    });
})

myApp.get('/tasks/:id', function (req, res) {
    tasks.findOne({
        _id: req.params.id
    }).then(function (task) {
        res.json(task);
    }).catch(function (err) {
        res.status(500).json({ error: "An error occurred while fetching tasks" });
        console.log(`DB Error: ${err}`);
    });
})

myApp.post('/tasks', [
    body('title').isString().trim().notEmpty().withMessage('Title is required and must be a string.'),
    body('description').optional().isString().trim().withMessage('Description must be a string.'),
    body('dueDate').optional().isISO8601().toDate().withMessage('Due date must be a valid date.'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be either "low", "medium", or "high".'),
    body('completed').optional().isBoolean().withMessage('Completed must be a boolean.'),
], function (req, res) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, dueDate, priority, completed } = req.body;

    const task1 = new tasks({
        title: title,
        description: description,
        dueDate: dueDate,
        priority: priority,
        completed: completed
    });
    task1.save().then(function (data) {
        res.send(`Received: ${data}`);
    }).catch(function (err) {
        console.log(`DB Error: ${err}`);
        res.status(500).send('Error saving the task to the database');
    });

})

myApp.put('/tasks/:id',[
        body('title').optional().isString().trim().notEmpty().withMessage('Title must be a non-empty string.'),
        body('description').optional().isString().trim().withMessage('Description must be a string.'),
        body('dueDate').optional().isISO8601().toDate().withMessage('Due date must be a valid date.'),
        body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be either "low", "medium", or "high".'),
        body('completed').optional().isBoolean().withMessage('Completed must be a boolean.'),
    ], function (req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const taskId = req.params.id;
        const updatedData = {
            title: req.body.title,
            description: req.body.description,
            dueDate: req.body.dueDate,
            priority: req.body.priority,
            completed: req.body.completed
        };
        tasks.findByIdAndUpdate(taskId, updatedData, { new: true })
            .then(function (updatedTask) {
                if (!updatedTask) {
                    return res.status(404).send('Task not found');
                }
                res.send(`Task updated: ${updatedTask}`);
            })
            .catch(function (err) {
                console.log(`DB Error: ${err}`);
                res.status(500).send('Error updating task');
            });
    });


myApp.delete('/tasks/:id', function (req, res) {
    const taskId = req.params.id;

    tasks.findByIdAndDelete(taskId)
        .then(function (deletedTask) {
            if (!deletedTask) {
                return res.status(404).send('Task not found');
            }
            res.send(`Task deleted: ${deletedTask}`);
        })
        .catch(function (err) {
            console.log(`DB Error: ${err}`);
            res.status(500).send('Error deleting task');
        });
});


const port = process.env.PORT || 8080;
myApp.listen(port, function () {
    console.log(`Listening on port 8080... http://localhost:${port}/`);
});




