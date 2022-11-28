const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
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

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("Unauthorized Access");
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

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
    const usersCollection = client.db("guitarStore").collection("users");

    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.position !== "Admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // category api
    app.get("/category", async (req, res) => {
      const query = {};
      const categorys = await categoryCollection.find(query).toArray();
      res.send(categorys);
    });

    // all product api
    app.get("/category/product", async (req, res) => {
      const query = {};
      const procucts = await categoryProductCollection.find(query).toArray();
      res.send(procucts);
    });

    // category wise api
    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { categori_id: id };
      const products = await categoryProductCollection.find(query).toArray();
      res.send(products);
    });

    // add product api
    app.post("/category/product", async (req, res) => {
      const categoryProduct = req.body;
      const result = await categoryProductCollection.insertOne(categoryProduct);
      res.send(result);
    });

    //booked post api
    app.post("/category/product/booked", async (req, res) => {
      const productBooked = req.body;
      const result = await productBookedCollection.insertOne(productBooked);
      res.send(result);
    });

    // booked get api

    app.get("/bookedProducts", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const bookings = await productBookedCollection.find(query).toArray();
      res.send(bookings);
    });

    // user post api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // jwt
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "7d",
        });
        return res.send({ accessToken: token });
      }

      res.status(403).send({ accessToken: "" });
    });

    // seller
    app.get("/users/seller", async (req, res) => {
      const query = { position: "Seller" };
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    // users
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    // buyer
    app.get("/users/buyer", async (req, res) => {
      const query = { position: "Buyer" };
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    // myproducts
    app.get("/myProducts", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await categoryProductCollection.find(query).toArray();
      res.send(result);
    });

    // is admin
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.position === "Admin" });
    });

    // is seller
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.position === "Seller" });
    });

    // is buyer
    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.position === "Buyer" });
    });

    // delete user
    app.delete("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });
    // delete product
    app.delete("/product/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await categoryProductCollection.deleteOne(filter);
      res.send(result);
    });

    // verified status
    app.put(
      "/users/verify/:email",
      verifyJWT,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const filter = { email: email };
        const option = { upsert: true };
        const updateedDoc = {
          $set: {
            verified: true,
          },
        };
        const result = await usersCollection.updateOne(
          filter,
          updateedDoc,
          option
        );
        // const result2 = await categoryProductCollection.updateOne(
        //   filter,
        //   updateedDoc,
        //   option
        // );
        res.send(result);
      }
    );
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("resale server");
});
app.listen(port, () => console.log("server is running"));
