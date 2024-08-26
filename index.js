// const express = require('express');
// const { MongoClient } = require('mongodb');
// const bodyParser = require('body-parser');
// const fs = require('fs');
// const mammoth = require('mammoth');
// const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// const app = express();
// const port = 3000;

// // MongoDB connection URI
// const uri = 'mongodb://localhost:27017/';

// // Middleware
// app.use(bodyParser.urlencoded({ extended: true }));
// app.set('view engine', 'ejs');

// // Function to get questions from MongoDB
// async function getQuestionsFromDB() {
//     const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//     try {
//         await client.connect();
//         const database = client.db('Dean_project_trial');
//         const collection = database.collection('list of questions');

//         // Fetch all questions
//         const questions = await collection.find({}).toArray();
//         return questions;
//     } finally {
//         await client.close();
//     }
// }

// // Route to display questions with checkboxes
// app.get('/', async (req, res) => {
//     try {
//         const questions = await getQuestionsFromDB();
//         res.render('index', { questions });
//     } catch (error) {
//         console.error('Error fetching questions:', error);
//         res.status(500).send('Error fetching questions');
//     }
// });

// // Route to handle form submission and generate paper
// app.post('/generate-paper', async (req, res) => {
//     const selectedQuestionIds = req.body.selectedQuestions;
    
//     if (!selectedQuestionIds) {
//         return res.status(400).send('No questions selected.');
//     }

//     const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//     try {
//         await client.connect();
//         const database = client.db('Dean_project_trial');
//         const collection = database.collection('list of questions');

//         const selectedQuestions = await collection.find({
//             _id: { $in: selectedQuestionIds.map(id => new MongoClient.ObjectId(id)) }
//         }).toArray();

//         // Here you would generate the paper based on selectedQuestions

//         res.send(selectedQuestions); // Replace this with actual paper generation logic
//     } finally {
//         await client.close();
//     }
// });

// // Original function to convert .docx tables to CSV
// async function convertDocxTablesToCsv(inputFilePath) {
//     try {
//         // Your existing code to convert .docx to CSV
//     } catch (error) {
//         console.error('An error occurred during conversion:', error);
//     }
// }

// // Start the server
// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });

// // Usage example: convert .docx tables to CSV
// // convertDocxTablesToCsv('input.docx');


const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');  // Import ObjectId
const bodyParser = require('body-parser');
const fs = require('fs');
const mammoth = require('mammoth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
const port = 3000;

// MongoDB connection URI
const uri = 'mongodb://localhost:27017/';

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Function to get questions from MongoDB
async function getQuestionsFromDB() {
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db('Dean_project_trial');
        const collection = database.collection('list of questions');
        const questions = await collection.find({}).toArray();
        return questions;
    } finally {
        await client.close();
    }
}

// Route to display questions with checkboxes
app.get('/', async (req, res) => {
    try {
        const questions = await getQuestionsFromDB();
        res.render('index', { questions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).send('Error fetching questions');
    }
});

// Route to handle form submission and generate paper
app.post('/generate-paper', async (req, res) => {
    const selectedQuestionIds = req.body.selectedQuestions;

    console.log('Raw selectedQuestionIds:', selectedQuestionIds);

    if (!selectedQuestionIds) {
        return res.status(400).send('No questions selected.');
    }

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db('your_database_name');
        const collection = database.collection('your_collection_name');

        // Convert selectedQuestionIds to an array of ObjectId
        const objectIds = Array.isArray(selectedQuestionIds) ? 
                          selectedQuestionIds.map(id => new ObjectId(id)) : 
                          [new ObjectId(selectedQuestionIds)];

        console.log('Converted ObjectIds:', objectIds);

        const selectedQuestions = await collection.find({ _id: { $in: objectIds } }).toArray();

        console.log('Fetched Questions:', selectedQuestions);

        res.render('selected-questions', { selectedQuestions });
    } catch (error) {
        console.error('Error generating paper:', error);
        res.status(500).send('An error occurred while generating the paper.');
    } finally {
        await client.close();
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
