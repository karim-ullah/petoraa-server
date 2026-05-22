const express = require('express')
const app = express()
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()

const { MongoClient, ServerApiVersion } = require('mongodb')
const PORT = process.env.PORT

app.use(express.json())
app.use(cors())

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri,{
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationError: true
    }
})

const run = async() =>{
    try{
        await client.connect()
        const db = client.db('petoraa')
        const petsCollections = db.collection('pets') 


        app.post('/pets', async(req,res)=>{
            const pet = req.body
            const result = await petsCollections.insertOne(pet)
            res.send(result)
        })

        app.get('/pets', async(req,res)=>{
            const result = await petsCollections.find().toArray()
            res.send(result)
        })


        await client.db('admin').command({ping : 1})
        console.log('You are succesfully connected to mongodb');
    } finally{

    }
}

run().catch(console.dir)

app.get('/', (req,res) =>{
    res.send('Hello from server')
})

app.listen(PORT, ()=>{
    console.log(`server is running from the port ${PORT}`);
})