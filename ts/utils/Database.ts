import mongodb, { CollectionInsertOneOptions, FindOneOptions } from 'mongodb';
import { DB_NAME } from './constants';

export default new class {
    protected db: mongodb.Db; 
    protected _inited: boolean = false;

    get is_init() {
        return this._inited;
    }

    async init(url: string) {
        const connecter = mongodb.MongoClient;
    
        // Use connect method to connect to the server
        const client = await new Promise(resolve => {
            connecter.connect(url, { useNewUrlParser: true }, (err, client) => {
                if (err !== null) throw new TypeError('Error while connecting to MongoServer');
                console.log("Connected successfully to MongoDB server");
                resolve(client);
            });
        }) as mongodb.MongoClient;
        
        this.db = client.db(DB_NAME);
    }

    get database() {
        return this.db;
    }

    collection(name: string) {
        return this.db.collection(name);
    }

    async insertTo<T>(collectionName: string, document: T, options?: CollectionInsertOneOptions) {
        const result = await this.collection(collectionName).insertOne(document, options);

        // Obtient uniquement le document inséré et supprime son identifiant unique
        const trimmed = result.ops[0];
        const id = trimmed['_id'];
        delete trimmed['_id'];

        return [trimmed, id, result.insertedId] as [T, string, mongodb.ObjectID];
    }

    async get(collectionName: string, query: any, options?: FindOneOptions, sanitize = false) {
        const res = await this.collection(collectionName).find(query, options).toArray();

        if (sanitize) res.forEach(e => delete e['_id']);

        return res;
    }

    async getOne(collectionName: string, query: any, options?: FindOneOptions, sanitize = false) {
        const res = await this.collection(collectionName).findOne(query, options)[0];

        if (sanitize) res ? delete res['_id'] : void 0;

        return res;
    }
};
