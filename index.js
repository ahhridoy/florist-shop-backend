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

console.log(uri);

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

        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });

        app.get("/placeOrder/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.send(product);
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
