import express from 'express';
import mongodb from 'mongodb';

const app = express();

export function main(port: number) {
    app.get('/', (_, res) => {
        res.json({ hello: true });
    });
    
    app.listen(port, () => {
        console.log(`Server is listening on port ${port}.`);
    });
}


