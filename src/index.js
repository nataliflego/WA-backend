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

    nazivbolesti = req.body.nazivbolesti.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
    mjesto = req.body.mjesto.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
    opis = req.body.opis.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

    let prvoslovoopisa = req.body.opis.charAt(0).toUpperCase();
    let ostatakopisa = req.body.opis.substring(1);
    let spojeno = prvoslovoopisa + ostatakopisa;

    let danasnjidatum = new Date();
    let formatirani = danasnjidatum.toLocaleDateString("hr-HR");

    let item = await db.collection("iskustva").insertOne({
        nazivbolesti: nazivbolesti,
        lijek: req.body.lijek,
        mjesto: mjesto,
        email: req.body.email,
        opis: spojeno,
        kljucnerijeci: req.body.kljucnerijeci,
        datum: formatirani
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

//dobivanje svih komentara za određeno iskustvo
app.get('/iskustvo/:experienceId/komentari', async (req, res) => {
    let db = await connect("bolesti");
    try {
        const iskustvo = await db.collection('iskustva').findOne({ _id: ObjectId(req.params.experienceId) });
        const komentari = await db.collection('komentari').find({ experienceId: req.params.experienceId }).toArray();
        res.json(komentari);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error kod komentara' });
    }
});
// dodavanje komentara
app.post('/iskustvo/:experienceId/komentari', async (req, res) => {
    let db = await connect("bolesti");
    /*  console.log("spojena baza ", db); */
    try {
        const iskustvo = await db.collection('iskustva').findOne({ _id: ObjectId(req.params.experienceId) });
        const newComment = {
            experienceId: req.params.experienceId,
            author: req.body.author,
            text: req.body.text,
            objavljeno: Date.now(),
        };
        const result = await db.collection('komentari').insertOne(newComment);
        console.log("'Result': ", result)
        /* res.json(result.ops[0]); */
        res.json(result.insertedId);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error kod ubacivanja komentara' });
    }
});

// brisanje komentara
app.delete('/iskustvo/:experienceId/komentari/commentId', async (req, res) => {
    let db = await connect("bolesti");
    let experienceId = req.params.experienceId;
    let commentId = req.params.commentId;

    let rez = await db.collection('komentari').deleteOne({ _id: ObjectId(commentId) });
    if (rez.deletedCount === 0) {
        return res.status(404).json({ message: 'Comment not found' });
    }
    res.json({ message: `Komentar sa ID ${commentId} je obrisan.` });
})


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
