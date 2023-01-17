import express from 'express'

import connect from './db.js'
import { ObjectId } from 'mongodb'
const app = express()
const port = 3000
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => { })

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
