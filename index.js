const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const app = express();
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const port = 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s1xse.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

async function run() {
    try {
        await client.connect();
        console.log("database connected");
        const database = client.db("florist_shop");
        const productsCollection = database.collection("products");
        const placeOrdersCollection = database.collection("placeOrder");
        const usersCollection = database.collection("users");

        // get all products
        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });

        // get one product
        app.get("/placeOrder/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
        });

        // post one product for place order
        app.post("/placeOrder", async (req, res) => {
            const placeOrder = req.body;
            const result = await placeOrdersCollection.insertOne(placeOrder);
            res.json(result);
        });

        // get product by using email
        app.get("/myOrders", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = placeOrdersCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // delete one product
        app.delete("/myOrders/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await placeOrdersCollection.deleteOne(query);
            res.json(result);
        });

        // post users information
        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        // filter users information for register or login
        app.put("/users", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.json(result);
        });
    } finally {
        // await client.close()
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
