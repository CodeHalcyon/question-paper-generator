const { MongoClient } = require("mongodb");
require('dotenv').config();

async function getQuestionsFromDB(collectionname) {
  // Validate the collection name before proceeding
  if (!collectionname || typeof collectionname !== 'string') {
    throw new Error("Invalid collection name. It must be a non-empty string.");
  }

  let uri =  process.env.MONGODB_URI;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const database = client.db("testing1");
    const collection = database.collection(collectionname);
    const questions = await collection.find({}).toArray();

    return questions;
  } finally {
    await client.close();
  }
}

module.exports = { getQuestionsFromDB };
