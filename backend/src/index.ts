import express, { Request, Response } from "express";
import { MongoClient } from "mongodb";
import type { Document, Collection } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const corsOption = {
  origin: ["http://localhost:3000"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOption));

const uri = process.env.MONGODB_ATLAS_URI;
if (!uri) throw new Error("MONGODB_ATLAS_URI is not defined in your .env file");

const client = new MongoClient(uri);

//Strongly typed collection
let collection: Collection<Product>;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    const db = client.db("store");
    collection = db.collection<Product>("products");
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}
connectDB();

//Product interface
interface Product {
  _id?: string;
  name: string;
  brand: string;
  price: number;
  ram: string;
  processor: string;
  score?: number;
}

//Search endpoint
app.get("/api/search", async (req: Request, res: Response) => {
  try {
    const { q = "", page = "1" } = req.query;
    const query = (q as string).trim();

    if (!query) {
      return res.json({
        results: [],
        totalCount: 0,
      });
    }

    const pageNum = parseInt(page as string, 10) || 1;
    const limit = 5;
    const skip = (pageNum - 1) * limit;

    //aggregation pipeline for search data
    const pipeline: Document[] = [
      {
        $search: {
          index: "laptops",
          autocomplete: {
            query,
            path: "name",
            tokenOrder: "sequential",
            fuzzy: {
              maxEdits: 2,
              maxExpansions: 100,
              prefixLength: 2,
            },
          },
        },
      },
      {
        $set: {
          score: { $meta: "searchScore" },
        },
      },
      { $sort: { score: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          name: 1,
          brand: 1,
          price: 1,
          ram: 1,
          processor: 1,
          score: 1,
        },
      },
    ];
    //aggregation pipeline to count no. of search results
    const countPipeline: Document[] = [
      {
        $searchMeta: {
          index: "laptops",
          autocomplete: {
            query,
            path: "name",
            tokenOrder: "sequential",
            fuzzy: {
              maxEdits: 2,
              maxExpansions: 100,
              prefixLength: 2,
            },
          },
        },
      },
    ];

    const [results, countMeta] = await Promise.all([
      collection.aggregate<Product>(pipeline).toArray(),
      collection.aggregate<Document>(countPipeline).toArray(),
    ]);

    const totalCount = countMeta[0]?.count?.total || 0;

    res.json({
      results,
      totalCount,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start server
app.listen(4000, () => console.log("✅ Server running on port 4000"));
