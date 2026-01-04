const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5174", "https://paw-mart.pages.dev"],

    credentials: true,
  })
);

// Mongo URI
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.gab2mh0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Global cached client (Vercel Requirement)
let client;
let clientPromise;

if (!clientPromise) {
  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  clientPromise = client.connect();
}

// Root route
app.get("/", async (req, res) => {
  res.send("pawmart vercel server is running");
});

// MAIN FUNCTION
async function run() {
  const con = await clientPromise;

  const db = con.db("pawmart_db");
  const productsCollection = db.collection("products");
  const myProductCollection = db.collection("myProduct");
  const ordersCollection = db.collection("myorders");
  const usersCollection = db.collection("users");

  // ----------------------- ROUTES -------------------------

  app.get("/users/:email", async (req, res) => {
    const email = req.params.email;
    const user = await usersCollection.findOne({ email });
    res.send(user);
  });

  app.put("/users", async (req, res) => {
    const user = req.body;

    const result = await usersCollection.updateOne(
      { email: user.email },
      {
        $setOnInsert: {
          role: "user",
          bio: "",
          location: "",
          joinDate: new Date(),
        },
        $set: {
          uid: user.uid,
          name: user.name,
          photoURL: user.photoURL,
        },
      },
      { upsert: true }
    );

    res.send(result);
  });

  app.put("/user/update-profile/:email", async (req, res) => {
    const email = req.params.email;
    const updateData = req.body;

    try {
      const result = await usersCollection.findOneAndUpdate(
        { email },
        { $set: updateData },
        { returnDocument: "after" }
      );
      res.send(result.value);
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Failed to update user" });
    }
  });

  app.post("/orders", async (req, res) => {
    try {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Failed to save order" });
    }
  });

  app.get("/my-orders", async (req, res) => {
    const email = req.query.email;
    try {
      const orders = await ordersCollection
        .find({ buyerEmail: email })
        .toArray();
      res.send(orders);
    } catch (e) {
      res.status(500).send({ message: "Failed to fetch orders" });
    }
  });

  app.get("/myproduct", async (req, res) => {
    const email = req.query.email;
    const query = email ? { email } : {};
    const result = await myProductCollection
      .find(query)
      .sort({ date: -1 })
      .toArray();
    res.send(result);
  });

  app.get("/products/category-product/:category", async (req, res) => {
    const categoryParam = req.params.category.trim();
    const query = { category: { $regex: `^${categoryParam}$`, $options: "i" } }; // case-insensitive exact match
    try {
      const result = await productsCollection
        .find(query)
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Failed to fetch products by category" });
    }
  });

  app.get("/products", async (req, res) => {
    const email = req.query.email;
    const query = email ? { email } : {};
    const result = await productsCollection
      .find(query)
      .sort({ date: -1 })
      .toArray();
    res.send(result);
  });

  app.get("/products/product-details/:id", async (req, res) => {
    const id = req.params.id;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: "Invalid product ID" });

    const product = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.send(product);
  });

  app.get("/recent-listing", async (req, res) => {
    const result = await productsCollection
      .find()
      .sort({ date: -1 })
      .limit(6)
      .toArray();
    res.send(result);
  });

  app.post("/products", async (req, res) => {
    const newProduct = req.body;
    const result = await productsCollection.insertOne(newProduct);
    res.send(result);
  });

  app.get("/my-listings", async (req, res) => {
    const email = req.query.email;
    const result = await productsCollection.find({ email }).toArray();
    res.send(result);
  });

  app.put("/products/:id", async (req, res) => {
    const id = req.params.id;
    const updateData = req.body;
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    res.send(result);
  });

  app.delete("/products/:id", async (req, res) => {
    const id = req.params.id;
    const result = await productsCollection.deleteOne({
      _id: new ObjectId(id),
    });
    res.send(result);
  });

  
  app.get("/related/:category/:id", async (req, res) => {
    try {
      const { category, id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const relatedProducts = await productsCollection
        .find({
          category: category,
          _id: { $ne: new ObjectId(id) }, // exclude current product
        })
        .limit(3)
        .toArray();

      res.json(relatedProducts);
    } catch (err) {
      console.error("Error fetching related products:", err);
      res
        .status(500)
        .json({ message: "Server error fetching related products" });
    }
  });
}


run().catch(console.error);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
