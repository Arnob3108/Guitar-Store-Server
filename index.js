const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esqm07b.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoryCollection = client
      .db("guitarStore")
      .collection("Categories");
    const categoryProductCollection = client
      .db("guitarStore")
      .collection("categoryProduct");
    const productBookedCollection = client
      .db("guitarStore")
      .collection("productBooked");

    app.get("/category", async (req, res) => {
      const query = {};
      const categorys = await categoryCollection.find(query).toArray();
      res.send(categorys);
    });
    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { categori_id: id };
      const products = await categoryProductCollection.find(query).toArray();
      res.send(products);
    });

    app.post("/category/product", async (req, res) => {
      const categoryProduct = req.body;
      const result = await categoryProductCollection.insertOne(categoryProduct);
      res.send(result);
    });

    app.post("/category/product/booked", async (req, res) => {
      const productBooked = req.body;
      const result = await productBookedCollection.insertOne(productBooked);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("resale server");
});
app.listen(port, () => console.log("server is running"));
