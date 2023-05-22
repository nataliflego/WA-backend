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
        /*  console.log('Podaci korisnika: ', podacikorisnika); */
        let db = await connect();

        let doc = {
            ime: podacikorisnika.ime,
            username: podacikorisnika.username, // to je EMAIL
            password: await bcrypt.hash(podacikorisnika.password, 8)
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
            throw e;
            /* console.error(e); */
        }
    },
    async prijavi(username, password) {
        try {
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
        } catch (error) {
            console.error("Greska prilikom prijavi() na serveru", error);
            throw new Error("Prijava nije uspijela: Došlo je do pogreške na serveru.");
        }
    },
    verify(req, res, next) {
        if (req.headers['authorization']) {
            try {
                let authorization = req.headers['authorization'].split(' ');
                if (authorization[0] !== 'Bearer') {
                    return res.status(401).send();
                } else {
                    let token = authorization[1];
                    req.jwt = jwt.verify(authorization[1], process.env.JWT_TAJNA);
                    return next();
                }
            } catch (err) {
                return res.status(403).send(); // HTTP not-authorized
            }
        } else {
            return res.status(401).send();// HTTP invalid request
        }
    }
};