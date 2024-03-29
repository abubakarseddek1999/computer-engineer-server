const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;




// middleware
app.use(cors({
    origin: [
        // 'http://localhost:5173',
        "https://computer-engineer-879da.web.app",
        "https://computer-engineer-879da.firebaseapp.com"
    ],
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser())






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bidtnbd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


// middleware
const logger = (req, res, next) => {
    console.log('log: info', req.method, req.url);
    next();
}
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    // console.log('token in the middleware', token);

    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })

}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const serviceCollection = client.db('computer').collection('services');
        const bookingCollection = client.db('computer').collection('bookings');

        // auth related api

        app.post('/jwt', logger, async (req, res) => {
            const user = req.body;
            console.log('user for token', user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            })
                .send({ success: true });

        })

        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })

        // services related api
        app.get('/services', async (req, res) => {
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {

                // Include only the `title` and `imdb` fields in the returned document
                projection: { title: 1, service_id: 1, price: 1, img: 1 },
            };


            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })

        // Booking

        app.get('/bookings', logger, verifyToken, async (req, res) => {
            console.log("hi man", req.query.email);
            console.log('token owner info', req.user);
            if (req.user.email !== req.query.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }

            const result = await bookingCollection.find(query).toArray();
            res.send(result);
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);


        })

        // add service
        app.post('/services', async (req, res) => {
            const newServices = req.body;
            console.log(newServices);
            const result = await serviceCollection.insertOne(newServices);
            res.send(result)
        })

        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedBooking = req.body;
            console.log(updatedBooking);
            const updateDoc = {
                $set: {

                    status: updatedBooking.status
                },
            };
            const result = await bookingCollection.updateOne(filter, updateDoc);
            res.send(result);
        })


        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await bookingCollection.deleteOne(query);
            res.send(result);
        })

        // update product
        app.put('/services/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedService = req.body;
            const service = {
                $set: {
                    title: updatedService.title,
                    img: updatedService.img,
                    price: updatedService.price,
                    description: updatedService.description,
                    service_provider: updatedService.service_provider,


                }
            }
            const result = await serviceCollection.updateOne(filter, service, options)
            res.send(result)

        })

        // services delete
        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await serviceCollection.deleteOne(query);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('computer engineering is running')
})


app.listen(port, () => {
    console.log(`computer engineering is running on port ${port}`);
})