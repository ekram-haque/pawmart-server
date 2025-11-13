const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://pawmartdb:YZkA1sMkzpDrbGic@cluster0.gab2mh0.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("pawmart server is running");
});

async function run() {
  try {
    await client.connect();

    const db = client.db("pawmart_db");
    const productsCollection = db.collection("products");
    const myProductCollection = db.collection("myProduct");
    const ordersCollection = db.collection("myorders");

    // POST: Save order info to MongoDB
    app.post("/orders", async (req, res) => {
      const order = req.body;
      try {
        const result = await ordersCollection.insertOne(order);
        res.send(result);
      } catch (error) {
        console.error("Error saving order:", error);
        res.status(500).send({ message: "Failed to save order" });
      }
    });

// GET: fetch orders of logged-in user
app.get("/my-orders", async (req, res) => {
  const email = req.query.email; // logged-in user email
  try {
    const orders = await ordersCollection.find({ buyerEmail: email }).toArray();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to fetch orders" });
  }
});



    app.get("/myproduct", async (req, res) => {
      console.log(req.query);
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const cursor = myProductCollection.find(query).sort({ date: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get(
      "/products/category-filtered-product/:category",
      async (req, res) => {
        const category = req.params.category;
        const query = {};

        if (category) {
          query.category = category;
        }

        const cursor = productsCollection.find(query).sort({ date: -1 });
        const result = await cursor.toArray();
        res.send(result);
      }
    );

    app.get("/products", async (req, res) => {
      console.log(req.query);
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const cursor = productsCollection.find(query).sort({ date: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/products/product-details/:id", async (req, res) => {
      try {
        const id = req.params.id;
        console.log(req.params.id);
        if (!ObjectId.isValid(id))
          return res.status(400).json({ error: "Invalid product ID" });

        const product = await productsCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!product)
          return res.status(404).json({ error: "Product not found" });

        res.json(product);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    //recent listing product for home page ///////////
    app.get("/recent-listing", async (req, res) => {
      const cursor = productsCollection.find().sort({ date: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const newProducts = req.body;
      const result = await productsCollection.insertOne(newProducts);
      res.send(result);
    });

    app.get("/my-listings", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price,
        },
      };

      const result = await productsCollection.updateOne(query, update);
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    console.log(" MongoDB connected successfully!");
  } catch (error) {
    console.error(" MongoDB connection error:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(` pawmart server is running on port ${port}`);
});
