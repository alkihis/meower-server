"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const Errors_1 = __importDefault(require("../utils/Errors"));
const Database_1 = __importDefault(require("../utils/Database"));
const constants_1 = require("../utils/constants");
const mongodb_1 = require("mongodb");
const MeowGetter_1 = __importDefault(require("../utils/meows/MeowGetter"));
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
        meow.id = mongodb_1.Long.fromString(meow.id);
    }
    if (typeof meow.in_reply_to_status_id === 'string') {
        // @ts-ignore
        meow.in_reply_to_status_id = mongodb_1.Long.fromString(meow.in_reply_to_status_id);
    }
    // Save the meow in database
    await Database_1.default.insertTo(constants_1.MEOWS_COLL, meow);
    // Récupère le meow
    const final_meow = await MeowGetter_1.default.fromId(meow.id.toString());
    final_meow.remeowed = false;
    final_meow.favorited = false;
    return final_meow;
}
