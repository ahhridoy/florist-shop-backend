const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

// middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.s1xse.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

//JWT Auth
const generateJWTToken = (user) => {
    return jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: "500s" });
};

const verifyJWTToken = (req, res, next) => {
    try {
        const { authorization } = req.headers;
        const decoded = jwt.verify(authorization, process.env.TOKEN_SECRET);
        req.decodedEmail = decoded.email;
        next();
    } catch {}
};

async function run() {
    try {
        await client.connect();
        console.log("database connected");
        const database = client.db("florist_shop");
        const productsCollection = database.collection("products");
        const placeOrdersCollection = database.collection("placeOrder");
        const usersCollection = database.collection("users");
        const usersReviewCollection = database.collection("reviews");

        // Manual Authentication
        app.post("/userRegister", async (req, res) => {
            const hashedPass = await bcrypt.hash(req.body.password, 10);
            const newUser = {
                displayName: req.body.name,
                password: hashedPass,
                email: req.body.email,
            };
            const result = await usersCollection.insertOne(newUser);
            res.json(result);
        });

        app.post("/userLogin", async (req, res) => {
            const userInfo = req.body;
            const newUser = {
                email: userInfo.email,
                password: "jwttoken",
            };
            const token = generateJWTToken(newUser);
            const query = { email: userInfo.email };
            const user = await usersCollection.findOne(query);

            const matchedUser = {
                displayName: user.displayName,
                email: user.email,
            };
            console.log("match", matchedUser);

            const passValidate = await bcrypt.compare(
                userInfo.password,
                user.password
            );

            if (passValidate) {
                console.log("password milche");
                res.json({ token: token, status: "login", user: matchedUser });
            } else {
                console.log("password mile nai");
                res.json({ status: "notlogin" });
            }
        });

        // get all products
        app.get("/products", async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });

        // admin can post products
        app.post("/products", async (req, res) => {
            const products = req.body;
            const result = await productsCollection.insertOne(products);
            res.json(result);
        });

        // admin can delete products
        // app.delete("/products/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await productsCollection.deleteOne(query);
        //     res.json(result);
        // });

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

        // delete one order
        app.delete("/myOrders/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await placeOrdersCollection.deleteOne(query);
            res.json(result);
        });

        // post review for place order
        app.post("/reviews", async (req, res) => {
            const review = req.body;
            const result = await usersReviewCollection.insertOne(review);
            res.json(result);
        });

        // get users review
        app.get("/usersReview", async (req, res) => {
            const cursor = usersReviewCollection.find({});
            const reviews = await cursor.toArray();
            res.send(reviews);
        });

        // get review by using email
        // app.get("/usersReview", async (req, res) => {
        //     const email = req.query.email;
        //     const query = { email: email };
        //     const cursor = usersReviewCollection.find(query);
        //     const reviews = await cursor.toArray();
        //     res.send(reviews);
        // })

        // // post users information
        // app.post("/users", async (req, res) => {
        //     const user = req.body;
        //     const result = await usersCollection.insertOne(user);
        //     res.json(result);
        // });

        // // filter users information for register or login
        // app.put("/users", async (req, res) => {
        //     const user = req.body;
        //     const filter = { email: user.email };
        //     const options = { upsert: true };
        //     const updateDoc = { $set: user };
        //     const result = await usersCollection.updateOne(
        //         filter,
        //         updateDoc,
        //         options
        //     );
        //     res.json(result);
        // });

        // add role to users information
        app.put("/users/admin", async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: "admin" } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

        // check admin in users information
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
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
