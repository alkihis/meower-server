"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("./Database"));
const constants_1 = require("./constants");
const bson_1 = require("bson");
exports.default = new class {
    getReplyCountOf(id) {
        return Database_1.default.collection(constants_1.MEOWS_COLL).countDocuments({
            in_reply_to_status_id: bson_1.Long.fromString(id)
        });
    }
    getRemeowCountOf(id) {
        return Database_1.default.collection(constants_1.MEOWS_COLL).countDocuments({
            remeow_of: id
        });
    }
    getFavoriteCountOf(id) {
        return Database_1.default.collection(constants_1.FAV_COLL).countDocuments({
            meow: id
        });
    }
    async hasRemeow(user_id, meow_id) {
        const exists = await Database_1.default.getOne(constants_1.MEOWS_COLL, {
            user_owner: user_id, remeow_of: meow_id
        });
        return !!exists;
    }
    async hasFavorited(user_id, meow_id) {
        const exists = await Database_1.default.getOne(constants_1.FAV_COLL, {
            emitter: user_id, meow: meow_id
        });
        return !!exists;
    }
};
