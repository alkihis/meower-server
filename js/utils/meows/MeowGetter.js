"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const Database_1 = __importDefault(require("../Database"));
const bson_1 = require("bson");
const User_1 = require("../User");
const helpers_1 = require("../../helpers");
const MeowHelper_1 = __importDefault(require("../MeowHelper"));
const Errors_1 = __importDefault(require("../Errors"));
exports.default = new class {
    async fromId(id, user) {
        const id_long = bson_1.Long.fromString(id);
        const res = await Database_1.default.get(constants_1.MEOWS_COLL, { id: id_long }, undefined, true);
        if (res.length === 0) {
            throw Errors_1.default.meow_not_found;
        }
        return this.constructDatabaseMeowToRealMeow(res[0], user);
    }
    async fromIds(id, user) {
        const ids = id.map(e => bson_1.Long.fromString(e));
        const res = await Database_1.default.get(constants_1.MEOWS_COLL, { id: { $in: ids } }, undefined, true);
        return Promise.all(res.map(e => this.constructDatabaseMeowToRealMeow(e, user)));
    }
    async constructDatabaseMeowToRealMeow(p, user) {
        p.id = p.id.toString();
        p.in_reply_to_status_id = p.in_reply_to_status_id ? p.in_reply_to_status_id.toString() : null;
        if (p.remeow_of) {
            // Construction du remeow
            try {
                p.remeowed_status = await this.fromId(p.remeow_of, user);
            }
            catch { }
        }
        if (p.quote_of) {
            // Construction du quote
            try {
                p.quoted_status = await this.fromId(p.remeow_of, user);
            }
            catch { }
        }
        return Object.assign({
            in_reply_to_screen_name: (p.in_reply_to_user_id ?
                await User_1.User.getScreenNameFromId(p.in_reply_to_user_id) :
                null),
            user: (await User_1.User.fromId(p.user_owner)).as_obj,
            reply_count: await MeowHelper_1.default.getReplyCountOf(p.id),
            remeow_count: await MeowHelper_1.default.getRemeowCountOf(p.id),
            favorite_count: await MeowHelper_1.default.getFavoriteCountOf(p.id),
            entities: await helpers_1.constructMeowEntities(p),
            remeowed: (user ? await MeowHelper_1.default.hasRemeow(user.id, p.id) : null),
            favorited: (user ? await MeowHelper_1.default.hasFavorited(user.id, p.id) : null)
        }, p);
    }
    async getRepliesOf(id, user, count = 20) {
        return this.query({ reply_of: id, count }, user);
    }
    async getConversationFrom(id, depth = 10) {
        // vers bas
        Database_1.default.collection(constants_1.MEOWS_COLL).aggregate([{
                $match: {
                    id: bson_1.Long.fromString(id)
                }
            }, {
                $graphLookup: {
                    from: constants_1.MEOWS_COLL,
                    startWith: "id",
                    connectFromField: "in_reply_to_status_id",
                    connectToField: "id",
                    as: "meowConversation",
                    maxDepth: depth
                }
            }]);
        // vers haut
        Database_1.default.collection(constants_1.MEOWS_COLL).aggregate([{
                $match: {
                    in_reply_to_status_id: bson_1.Long.fromString(id)
                }
            }, {
                $graphLookup: {
                    from: constants_1.MEOWS_COLL,
                    startWith: "in_reply_to_status_id",
                    connectFromField: "id",
                    connectToField: "in_reply_to_status_id",
                    as: "meowConversation",
                    maxDepth: depth
                }
            }]);
    }
    async query({ screen_name = "", reply_of = "", since_id = "", max_id = "", count = 50, with_replies = true, user_id = "", followers_of_user_id = "" } = {}, logged_user) {
        const query = {};
        if (screen_name) {
            if (Array.isArray(screen_name)) {
                query.screen_name = { $in: screen_name };
            }
            else {
                query.screen_name = screen_name;
            }
        }
        if (!with_replies) {
            query.in_reply_to_status_id = { $ne: null };
        }
        if (reply_of) {
            if (Array.isArray(reply_of)) {
                query.in_reply_to_status_id = { $in: reply_of.map(r => bson_1.Long.fromString(r)) };
            }
            else {
                query.in_reply_to_status_id = bson_1.Long.fromString(reply_of);
            }
        }
        if (user_id) {
            if (Array.isArray(user_id)) {
                query.user_owner = { $in: user_id };
            }
            else {
                query.user_owner = user_id;
            }
        }
        if (followers_of_user_id) {
            const followers_of = new Set();
            const to_add = (!Array.isArray(followers_of_user_id) ? [followers_of_user_id] : followers_of_user_id);
            for (const user of to_add) {
                const followers = await User_1.User.getFollowersOf(user);
                for (const f of followers) {
                    followers_of.add(f);
                }
            }
            if (query.user_owner) {
                // Ajoute au set les/l'utilisateur(s) déjà demandés
                if (typeof query.user_owner === 'string') {
                    followers_of.add(query.user_owner);
                }
                else {
                    for (const f of query.user_owner.$in) {
                        followers_of.add(f);
                    }
                }
            }
            query.user_owner = { $in: [...followers_of] };
        }
        if (since_id) {
            query.id = { $gt: bson_1.Long.fromString(since_id) };
        }
        if (max_id) {
            if (query.id) {
                query.id.$lte = bson_1.Long.fromString(max_id);
            }
            else {
                query.id = { $lte: bson_1.Long.fromString(max_id) };
            }
        }
        // Requête !
        const results = await Database_1.default.get(constants_1.MEOWS_COLL, query, { limit: count }, true);
        return Promise.all(results.map(m => this.constructDatabaseMeowToRealMeow(m, logged_user)));
    }
};
