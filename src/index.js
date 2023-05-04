import dotenv from "dotenv"
dotenv.config();

import cors from 'cors'

import express from 'express'
import connect from './db.js'
import { ObjectId } from 'mongodb'

import auth from './auth';

const app = express()
const port = 3000

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => { })

// vrć middleware funkcije na rute [auth.verify]

app.post("/prijava", async (req, res) => {
    let user = req.body;

    try {
        let result = await auth.prijavi(user.username, user.password);
        res.json(result);
    } catch (e) {
        res.status(401).json({ erorr: e.message })
    }
})

app.post("/registracija", async (req, res) => {
    let user = req.body;

    let id;
    try {
        id = await auth.registriraj(user);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }

    res.json({ id: id });

})

/* const MongoClient = require('mongodb').MongoClient; */
app.get('/data', async (req, res) => {

    let db = await connect("bolesti");
    await db.collection("iskustva").find({}).toArray(function (err, result) {

        if (err) throw err;
        res.json(result);

    });
});

// spremanje iskustva u bazu (Forma.vue)
app.post("/iskustvo", async (req, res) => {
    //spajanje baze
    let db = await connect("bolesti");
    let { nazivbolesti, lijek, mjesto, email, opis, kljucnerijeci } = req.body;

    kljucnerijeci = [];

    //dobivanje kolekcije
    let item = await db.collection("iskustva").insertOne({
        nazivbolesti: req.body.nazivbolesti,
        lijek: req.body.lijek,
        mjesto: req.body.mjesto,
        email: req.body.email,
        opis: req.body.opis,
        kljucnerijeci: req.body.kljucnerijeci

    });

    if (item) {

        res.json({
            status: "OK",
            message: `Item ${nazivbolesti} saved in DB`,
        });
    } else {
        res.json({
            status: "Failed",
            message: "Couldn't save item in DB",
        });
    }
});

app.get("/iskustvo/:id", async (req, res) => {
    let db = await connect("bolesti");
    let id = req.params.id;
    console.log(id);

    let query = { _id: ObjectId(id) };
    let item = await db.collection("iskustva").findOne(query);
    /*  res.setHeader('Content-Type', 'application/json'); */
    if (item) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(item))
        /* res.json({

            
            item: item,

        }); */
    } else {
        res.json({
            status: "Failed",
            message: `Couldn't find item by id ${id}`,
        });
    }
});

// pretraga bolesti
app.get('/upisibolest', async (req, res) => {
    let db = await connect("bolesti");
    let term = req.query.term;
    let reg = `/${term}/`;
    console.log(reg)
    let item = await db.collection("iskustva").find({ kljucnerijeci: { $regex: term, $options: 'i' } });
    item = await item.toArray();
    if (item) {
        res.json({
            /*   status: "OK", */
            item: item,
        });
    } else {
        res.json({
            status: "Failed",
            message: `Couldn't find item by term ${term}`,
        });
    }

});



app.listen(port, () => console.log(`slusam na ${port}`))
