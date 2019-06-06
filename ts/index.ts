import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import Database from './utils/Database';
import { MEOWS_COLL } from './utils/constants';
import { Long } from 'mongodb';
import { login } from './helpers';

export const SERVER = express();

export default async function main(port: number, url: string) {
    // Accept application/json, application/x-www-url-formencoded, multipart/form-data
    SERVER.use(express.json({ limit: 2048 * 1024 }));
    SERVER.use(bodyParser.urlencoded({ extended: true }));
    SERVER.use(multer().none());

    SERVER.use(login);

    await Database.init(url);

    SERVER.get('/', async (_, res) => {
        // await Database.insertTo(MEOWS_COLL, {
        //     id: Long.fromString("9007199254740993"),
        //     text: 'Coucou big2'
        // });
        // await Database.insertTo(MEOWS_COLL, {
        //     id: Long.fromString("6"),
        //     text: 'Coucou, mais avec un 6'
        // });
        console.log(
            await Database.get(MEOWS_COLL, { id: { $gt: 5 } }),
            await Database.get(MEOWS_COLL, { id: { $gt: Long.fromString("5") } }),
            await Database.get(MEOWS_COLL, { id: "6" })
        )

        res.json({ hello: true });
    });
    
    SERVER.listen(port, () => {
        console.log(`Server is listening on port ${port}.`);
    });
}


