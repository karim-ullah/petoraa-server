const express = require("express");
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
dotenv.config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationError: true,
  },
});

const JWKS = createRemoteJWKSet(new URL("http://localhost:3000/api/auth/jwks"));

const verifyToken = async (req, res, next) => {
  const authHead = req?.headers.authorization;
  const token = authHead.split(" ")[1];
  if (!authHead) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload);
    next();
  } catch (error) {
    return res.status(403).json({ message: "forbidden" });
  }
};

const run = async () => {
  try {
    await client.connect();
    const db = client.db("petoraa");
    const petsCollections = db.collection("pets");
    const adoptions = db.collection("adoptions");

    app.post("/pets", async (req, res) => {
      const pet = req.body;
      const result = await petsCollections.insertOne(pet);
      res.send(result);
    });

    app.post("/adoptions", async (req, res) => {
      const adoption = req.body;
      const { petName, userEmail } = adoption;
      const existingData = await adoptions.findOne({
        petName,
        userEmail,
      });
      if (existingData) {
        res.send({
          success: false,
          message: "All ready added",
        });
      } else {
        const result = await adoptions.insertOne(adoption);
        res.send(result);
      }
    });

    app.get('/adoptions/:userId', async(req,res)=>{
        const userId = req.params.userId
        const result = await adoptions.find({userId}).toArray()
        res.send(result)
    })

    app.get("/pets", async (req, res) => {
      const result = await petsCollections.find().toArray();
      res.send(result);
    });

    app.get("/pet/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await petsCollections.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/pets/:userId", verifyToken, async (req, res) => {
        const userId = req.params.userId

      const result = await petsCollections.find({ userId: userId }).toArray();

      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("You are succesfully connected to mongodb");
  } finally {
  }
};

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from server");
});

app.listen(PORT, () => {
  console.log(`server is running from the port ${PORT}`);
});
