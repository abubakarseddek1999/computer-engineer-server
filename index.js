const express = require('express');
const cors = require('cors');

require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;




const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://<username>:<password>@cluster0.bidtnbd.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
      // Booking

      app.get('/bookings',logger,verifyToken, async(req,res)=>{
        console.log("hi man" ,req.query.email);
        console.log('token owner info', req.user);
        if(req.user.email !== req.query.email ){
            return res.status(403).send({message: 'forbidden access'})
        }
        let query ={};
        if(req.query?.email){
            query ={email: req.query.email}
        }

        const result = await bookingCollection.find(query).toArray();
        res.send(result);
    })

    app.post('/bookings', async(req, res)=>{
        const booking= req.body;
        console.log(booking);
        const result =await bookingCollection.insertOne(booking);
        res.send(result);


    })
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('doctor is running')
})


app.listen(port, () => {
    console.log(`Car Doctor is running on port ${port}`);
})