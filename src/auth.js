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
            /*  if (result && result.insertedId) {
 
                 /*  return { id: result.insertedId, username: doc.username } */
            /*        let user = {
                        id: result.insertedId,
                        username: doc.username
                    }
                    let token = jwt.sign(user, process.env.JWT_TAJNA, {
                        algorithm: 'HS512',
                        expiresIn: '1 week'
                    });
                    user.token = token;
                    return {
                        user, username: user.username
                        /*    token,
                           id: user.id,
                           username: user.username */
            /*           };
                   } */

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
                    id: user._id,
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
                    console.log("Nije 'Bearer'")
                    return res.status(401).send();

                } else {
                    let token = authorization[1];
                    /* req.jwt = jwt.verify(authorization[1], process.env.JWT_TAJNA);
                    */ /*  req.user = jwt.verify(token, process.env.JWT_TAJNA);
                     */    let decoded = jwt.verify(token, process.env.JWT_TAJNA);
                    req.user = decoded;
                    return next();
                }
            } catch (err) {
                console.log("Nisi ovlašten")
                return res.status(403).send(); // HTTP not-authorized
            }
        } else {
            console.log("Neispravan zahtjev")
            return res.status(401).send();// HTTP invalid request
        }
        /* 
                const token = req.headers['authorization'];
                if (!token) {
                    return res.status(401).json({ error: 'Token nije nađen' });
                }
                jwt.verify(token, 'JWT_TAJNA', (err, decoded) => {
                    if (err) {
                        return res.status(401).json({ error: 'Nedobar token' });
                    }
                    req.username = decoded.username;
                    next();
                })  */
    }
};