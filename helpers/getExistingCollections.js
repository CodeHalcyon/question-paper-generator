const { MongoClient } = require('mongodb');
require('dotenv').config();

async function getExistingCollections(collections) {
    const uri =  process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // Connect to MongoDB
    await client.connect();
    const db = client.db(); // Use the default database

    // Get the list of existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(col => col.name);

    // Check which of the provided collections exist
    const result = collections.filter(col => existingCollectionNames.includes(col));

    return result;
  } catch (error) {
    console.error('Error fetching existing collections:', error);
    throw new Error('Unable to check existing collections');
  } finally {
    // Close the connection
    await client.close();
  }
}

module.exports = {getExistingCollections};
