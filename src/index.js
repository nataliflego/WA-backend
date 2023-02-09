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

app.post("/iskustvo", async (req, res) => {
    let db = await connect("bolesti");
    let { nazivbolesti, lijek, mjesto, email, opis, kljucnerijeci } = req.body;
    let item = await db.collection("iskustva").insertOne({
        nazivbolesti: nazivbolesti,
        lijek: lijek,
        mjesto: mjesto,
        email: email,
        opis: opis,
        kljucnerijeci: kljucnerijeci
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
    if (item) {
        res.json({
            status: "OK",
            data: {
                item: item,
            },
        });
    } else {
        res.json({
            status: "Failed",
            message: `Couldn't find item by id ${id}`,
        });
    }
});



app.listen(port, () => console.log(`slusam na ${port}`))
