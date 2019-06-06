"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = __importDefault(require("mongodb"));
const constants_1 = require("./constants");
exports.default = new class {
    constructor() {
        this._inited = false;
    }
    get is_init() {
        return this._inited;
    }
    async init(url) {
        const connecter = mongodb_1.default.MongoClient;
        // Use connect method to connect to the server
        const client = await new Promise(resolve => {
            connecter.connect(url, { useNewUrlParser: true }, (err, client) => {
                if (err !== null)
                    throw new TypeError('Error while connecting to MongoServer');
                console.log("Connected successfully to MongoDB server");
                resolve(client);
            });
        });
        this.db = client.db(constants_1.DB_NAME);
    }
    get database() {
        return this.db;
    }
    collection(name) {
        return this.db.collection(name);
    }
    async insertTo(collectionName, document, options) {
        const result = await this.collection(collectionName).insertOne(document, options);
        // Obtient uniquement le document inséré et supprime son identifiant unique
        const trimmed = result.ops[0];
        const id = trimmed['_id'];
        delete trimmed['_id'];
        return [trimmed, id, result.insertedId];
    }
    async get(collectionName, query, options, sanitize = false) {
        const res = await this.collection(collectionName).find(query, options).toArray();
        if (sanitize)
            res.forEach(e => delete e['_id']);
        return res;
    }
    async getOne(collectionName, query, options, sanitize = false) {
        const res = await this.collection(collectionName).findOne(query, options)[0];
        if (sanitize)
            res ? delete res['_id'] : void 0;
        return res;
    }
};
