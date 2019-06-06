"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const multer_1 = __importDefault(require("multer"));
const Database_1 = __importDefault(require("./utils/Database"));
const constants_1 = require("./utils/constants");
const mongodb_1 = require("mongodb");
const helpers_1 = require("./helpers");
exports.SERVER = express_1.default();
async function main(port, url) {
    // Accept application/json, application/x-www-url-formencoded, multipart/form-data
    exports.SERVER.use(express_1.default.json({ limit: 2048 * 1024 }));
    exports.SERVER.use(body_parser_1.default.urlencoded({ extended: true }));
    exports.SERVER.use(multer_1.default().none());
    exports.SERVER.use(helpers_1.login);
    await Database_1.default.init(url);
    exports.SERVER.get('/', async (_, res) => {
        // await Database.insertTo(MEOWS_COLL, {
        //     id: Long.fromString("9007199254740993"),
        //     text: 'Coucou big2'
        // });
        // await Database.insertTo(MEOWS_COLL, {
        //     id: Long.fromString("6"),
        //     text: 'Coucou, mais avec un 6'
        // });
        console.log(await Database_1.default.get(constants_1.MEOWS_COLL, { id: { $gt: 5 } }), await Database_1.default.get(constants_1.MEOWS_COLL, { id: { $gt: mongodb_1.Long.fromString("5") } }), await Database_1.default.get(constants_1.MEOWS_COLL, { id: "6" }));
        res.json({ hello: true });
    });
    exports.SERVER.listen(port, () => {
        console.log(`Server is listening on port ${port}.`);
    });
}
exports.default = main;
