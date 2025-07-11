import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

const uri = process.env.MONGODB_ATLAS_URI;

if (!uri) {
  throw new Error(" MONGODB_ATLAS_URI not found in .env");
}

const client = new MongoClient(uri);

async function seedData() {
  try {
    await client.connect();
    const db = client.db("store");
    const collection = db.collection("products");

    // Load the data
    const rawData = fs.readFileSync("dummy-products.json", "utf-8");
    const products = JSON.parse(rawData);

    // Optional: clear existing data first
    await collection.deleteMany({});

    // Insert new data
    const result = await collection.insertMany(products);
    console.log(`Inserted ${result.insertedCount} products`);
  } catch (err) {
    console.error("❌ Error seeding data:", err);
  } finally {
    await client.close();
  }
}

seedData();
