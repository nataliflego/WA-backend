import mongo from 'mongodb';
import connect from './db.js';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

(async () => {
    let db = await connect();
    await db.collection("korisnici").createIndex({ username: 1 }, { unique: true });
})();

export default {
    async registriraj(podacikorisnika) {
        /* console.log('tu smo', podacikorisnika); */
        let db = await connect();

        let doc = {
            ime: podacikorisnika.ime,
            username: podacikorisnika.username, // to je EMAIL
            password: await bcrypt.hash(podacikorisnika.password, 8)
            /* grad: podacikorisnika.grad */
        }
        try {
            let result = await db.collection('korisnici').insertOne(doc);
            if (result && result.insertedId) {
                return result.insertedId;
            }
        } catch (e) {
            if (e.code == 11000) {
                throw new Error("Korisnik već postoji")
            }
            /* console.error(e); */
        }
    },
    async prijavi(username, password) {
        let db = await connect()
        let user = await db.collection("korisnici").findOne({ username: username })

        if (user && user.password && (await bcrypt.compare(password, user.password))) {
            delete user.password
            let token = jwt.sign(user, process.env.JWT_TAJNA, {
                algorithm: 'HS512',
                expiresIn: '1 week'
            });      //za izdavanje novog tokena
            return {
                token,
                username: user.username
            };
        } else {
            throw new Error("Prijava nije uspijela")
        }
    },
    verify(req, res, next) {
        try {
            let authorization = req.headers.authorization.split(' ');
            let type = authorization[0];
            let token = authorization[1];

            if (type !== 'Bearer') {
                return res.status(401).send();

            } else {
                req.jwt = jwt.verify(token, process.env.JWT_TAJNA);
                return next();
            }
        } catch (e) {
            return res.status(401).send();
        }
    }
};