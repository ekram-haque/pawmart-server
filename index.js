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
    // const usersCollection = db.collection('user');

    // // user details

    //   //  Get user info
    //     app.get("/user/:email", async (req, res) => {
    //       const email = req.params.email;
    //       const user = await usersCollection.findOne({ email });
    //       res.send(user || {});
    //     });

    //     //  Update or create user profile
    //  app.put("/user/update-profile/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const updatedData = req.body;

    //   if (!updatedData || typeof updatedData !== "object") {
    //     return res.status(400).json({ error: "Invalid profile data" });
    //   }

    //   const result = await usersCollection.updateOne(
    //     { email },
    //     { $set: updatedData },
    //     { upsert: true }
    //   );
    //   res.json(result);
    // });

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

        // Validate ObjectId before using
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid product ID format" });
        }

        const query = { _id: new ObjectId(id) };
        const product = await productsCollection.findOne(query);

        if (!product) {
          return res.status(404).send({ error: "Product not found" });
        }

        res.send(product);
      } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).send({ error: "Internal Server Error" });
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

    app.patch("/products/:id", async (req, res) => {
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
