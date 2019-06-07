"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../User");
const Database_1 = __importDefault(require("../Database"));
const constants_1 = require("../constants");
const bson_1 = require("bson");
const helpers_1 = require("../../helpers");
const Errors_1 = __importDefault(require("../Errors"));
const simpleflakes_1 = require("simpleflakes");
exports.default = new class {
    async post(text, user, { media_ids = [], in_reply_to_id = "", quoted_status = "", remeow_of = "" } = {}) {
        const meow = {
            user_owner: user.id,
            text,
            quote_of: quoted_status ? quoted_status : undefined,
            remeow_of: remeow_of ? remeow_of : undefined,
            id: simpleflakes_1.simpleflake().toString(),
            in_reply_to_status_id: null,
            in_reply_to_user_id: null,
            created_at: new Date
        };
        if (in_reply_to_id) {
            // Check if tweet exists
            const reply = await this.getPartial(in_reply_to_id);
            if (reply) {
                meow.in_reply_to_status_id = in_reply_to_id;
                meow.in_reply_to_user_id = reply.user_owner;
            }
        }
    }
    async remeow(id, user) {
        const original = await this.get(id);
        return this.post(`RM @${original.user.screen_name}: ${original.text}`, user, { remeow_of: original.id });
    }
    async getPartial(id, user) {
        const meow = await Database_1.default.getOne(constants_1.MEOWS_COLL, { id: bson_1.Long.fromString(id) }, undefined, true);
        if (!meow) {
            throw Errors_1.default.meow_not_found;
        }
        // Change l'ID en ID string et renvoie
        return this.computeMeow(meow, user);
    }
    async get(id, user) {
        const partial = await this.getPartial(id, user);
        return Object.assign({
            in_reply_to_screen_name: (partial.in_reply_to_user_id ?
                await User_1.User.getScreenNameFromId(partial.in_reply_to_user_id) :
                null),
            user: (await User_1.User.fromId(partial.user_owner)).as_obj,
            reply_count: this.getReplyCountOf(partial.id),
            remeow_count: this.getRemeowCountOf(partial.id),
            favorite_count: this.getFavoriteCountOf(partial.id),
            entities: await helpers_1.constructMeowEntities(partial),
            remeowed: (user ? await this.hasRemeow(user.id, partial.id) : null),
            favorited: (user ? await this.hasFavorited(user.id, partial.id) : null)
        }, partial);
    }
    async computeMeow(meow_database_result, user) {
        meow_database_result.id = meow_database_result.id.toString();
        if (meow_database_result.remeow_of) {
            // Construction du remeow
            meow_database_result.remeowed_status = await this.get(meow_database_result.remeow_of, user);
        }
        if (meow_database_result.quote_of) {
            // Construction du quote
            meow_database_result.quoted_status = await this.get(meow_database_result.remeow_of, user);
        }
        return meow_database_result;
    }
    getReplyCountOf(id) {
        return 0;
    }
    getRemeowCountOf(id) {
        return 0;
    }
    getFavoriteCountOf(id) {
        return 0;
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
