const express = require('express');
let cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000; 


const app = express();    


app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rttpw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient (uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {

    try {
        await client.connect();
        const productsCollection = client.db('supplyChain').collection('products')

        function verifyJWT(req, res, next) {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).send({ message: "Unauthorized access" })
            }
            const token = authHeader.split(' ')[1]
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: "forbidden access" })
                }
                console.log(decoded)
                req.decoded = decoded;
                next();
            })

        }


        // AUTH
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            })
            res.send({ accessToken });
        })

        app.get('/products', async (req, res) => {
            const query = {};
            const cursor = productsCollection.find(query); 
            const products = await cursor.toArray();
            res.send(products);

        });

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const products = await productsCollection.findOne(query);
            res.send(products);
        });

        app.post('/products', async (req, res) => {
            const newproduct = req.body;
            const result = await productsCollection.insertOne(newproduct);
            res.send(result);
        })

        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.send(result)
        })

        app.put('/user/:id',async(req,res)=>{
            const id = req.params.id;
            const updateQuantity = req.body;
            const filter = {_id: ObjectId(id)};
            const options ={upsert: true}
            console.log(id)
            console.log(updateQuantity);

            const updatedDoc = {
                $set: {
                    quantity: updateQuantity.newQuantity
                }
            };
            const result = await productsCollection.updateOne(filter,updatedDoc,options);
            res.send(result)
        })
        app.put('/delivery/:id',async(req,res)=>{
            const id = req.params.id;
            const updateQuantity = req.body
            const delevary = updateQuantity.quantity -1;
            console.log(delevary);
            const filter = {_id: ObjectId(id)};
            const options ={upsert: true}
            const updatedDoc = {
                $set: {
                    quantity: delevary
                }
            };
            const result = await productsCollection.updateOne(filter,updatedDoc,options);
            res.send(result)
        })
    }

    catch {

    }

}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('running the server')
})


app.listen(port, () => {
    console.log('listening from', port)
})