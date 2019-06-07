"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const Errors_1 = __importDefault(require("../utils/Errors"));
const User_1 = require("../utils/User");
const Database_1 = __importDefault(require("../utils/Database"));
const constants_1 = require("../utils/constants");
const helpers_1 = require("../helpers");
const bson_1 = require("bson");
// Module de traitement d'un tweet
(async () => {
    await Database_1.default.init(constants_1.DATABASE_URL);
    worker_threads_1.parentPort.on('message', async (value) => {
        if (value && value.port instanceof MessagePort) {
            if (!value.meow) {
                value.port.postMessage(Errors_1.default.invalid_message);
            }
            else {
                const tweet = value.meow;
                // Traiter le meow, le sauvegarder en base de données.
                try {
                    const real_meow = await makeRealMeow(tweet);
                    value.port.postMessage({ meow: real_meow });
                }
                catch (e) {
                    value.port.postMessage(Errors_1.default.database_error);
                }
            }
            value.port.close();
        }
    });
})();
async function makeRealMeow(meow) {
    if (typeof meow.id === 'string') {
        // @ts-ignore
        meow.id = bson_1.Long.fromString(meow.id);
    }
    // Save the meow in database
    await Database_1.default.insertTo(constants_1.MEOWS_COLL, meow);
    meow.id = meow.id.toString();
    if (meow.created_at instanceof Date) {
        meow.created_at = meow.created_at.toISOString();
    }
    return Object.assign({
        reply_count: 0,
        remeow_count: 0,
        favorite_count: 0,
        user: (await User_1.User.fromId(meow.user_owner)).as_obj,
        favorited: false,
        remeowed: false,
        entities: await helpers_1.constructMeowEntities(meow)
    }, meow);
}
