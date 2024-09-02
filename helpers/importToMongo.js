const fs = require('fs');
const { MongoClient } = require('mongodb');
const csvParser = require('csv-parser');
const dotenv = require("dotenv")

// MongoDB connection URI and database/collection name
const uri =  process.env.MONGODB_URI; 
const dbName = process.env.DB_NAME;

// Function to read CSV and import data to MongoDB
async function importCsvToMongo(filePath,collection) {
    const collectionName = collection;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        console.log('Connected to MongoDB.');

        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        let i=1
        const records = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                // Convert CSV row to desired format
                
                const record = {
                    Q_No:(i), // Assuming 'column0' contains question number
                    Questions: row["Questions"],
                    Marks: row["Marks"],
                    BL: row["BL"],
                    CO: row["CO"],
                    'Unit No': row["Unit No"]
                };
                i++
                

                records.push(record);
            })
            .on('end', async () => {
                try {
                    // Insert records into MongoDB
                    const result = await collection.insertMany(records);
                    console.log(`${result.insertedCount} records inserted.`);
                } catch (err) {
                    console.error('Error inserting records:', err);
                } finally {
                    await client.close();
                }
            });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

module.exports = {importCsvToMongo}
