import { MEOWS_COLL } from "../constants";
import { PartialMeow, Meow } from "meower-interfaces";
import Database from "../Database";
import { Long } from "bson";
import { User } from "../User";
import { constructMeowEntities } from "../../helpers";
import MeowHelper from "../MeowHelper";
import Errors from "../Errors";

export default new class {
    async fromId(id: string, user?: User) : Promise<Meow> {
        const id_long = Long.fromString(id);

        const res = await Database.get(MEOWS_COLL, { id: id_long }, undefined, true);

        if (res.length === 0) {
            throw Errors.meow_not_found;
        }
        return this.constructDatabaseMeowToRealMeow(res[0], user);
    }

    async fromIds(id: string[], user?: User) : Promise<Meow[]> {
        const ids = id.map(e => Long.fromString(e));

        const res = await Database.get(MEOWS_COLL, { id: { $in: ids } }, undefined, true);

        return Promise.all(res.map(e => this.constructDatabaseMeowToRealMeow(e, user)));
    }

    protected async constructDatabaseMeowToRealMeow(p: PartialMeow, user?: User) : Promise<Meow> {
        p.id = p.id.toString();
        p.in_reply_to_status_id = p.in_reply_to_status_id ? p.in_reply_to_status_id.toString() : null;

        if (p.remeow_of) {
            // Construction du remeow
            try {
                (p as Meow).remeowed_status = await this.fromId(p.remeow_of, user);
            } catch { }
        }
        if (p.quote_of) {
            // Construction du quote
            try {
                (p as Meow).quoted_status = await this.fromId(p.remeow_of, user);
            } catch { }
        }

        return Object.assign({
            in_reply_to_screen_name: (
                p.in_reply_to_user_id ? 
                await User.getScreenNameFromId(p.in_reply_to_user_id) : 
                null
            ),
            user: (await User.fromId(p.user_owner)).as_obj,
            reply_count: await MeowHelper.getReplyCountOf(p.id),
            remeow_count: await MeowHelper.getRemeowCountOf(p.id),
            favorite_count: await MeowHelper.getFavoriteCountOf(p.id), 
            entities: await constructMeowEntities(p), 
            remeowed: (user ? await MeowHelper.hasRemeow(user.id, p.id) : null), 
            favorited: (user ? await MeowHelper.hasFavorited(user.id, p.id) : null)
        }, p);
    } 

    async getRepliesOf(id: string, user?: User, count: number = 20) {
        return this.query({ reply_of: id, count }, user);
    }

    async getConversationFrom(id: string, depth: number = 10) {

        // vers bas
        Database.collection(MEOWS_COLL).aggregate([{
            $match: {
                id: Long.fromString(id)
            }
        }, {
            $graphLookup: {
                from: MEOWS_COLL,
                startWith: "id",
                connectFromField: "in_reply_to_status_id",
                connectToField: "id",
                as: "meowConversation",
                maxDepth: depth
            }
        }]);

        // vers haut
        Database.collection(MEOWS_COLL).aggregate([{
            $match: {
                in_reply_to_status_id: Long.fromString(id)
            }
        }, {
            $graphLookup: {
                from: MEOWS_COLL,
                startWith: "in_reply_to_status_id",
                connectFromField: "id",
                connectToField: "in_reply_to_status_id",
                as: "meowConversation",
                maxDepth: depth
            }
        }])
    }

    async query({
            screen_name = "",
            reply_of = "",
            since_id = "",
            max_id = "",
            count = 50,
            with_replies = true,
            user_id = "",
            followers_of_user_id = ""
        } = {}, 
        logged_user?: User
    ) : Promise<Meow[]> {
        const query: any = {};

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
                query.in_reply_to_status_id = { $in: reply_of.map(r => Long.fromString(r)) };
            }
            else {
                query.in_reply_to_status_id = Long.fromString(reply_of);
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
            const followers_of = new Set<string>();

            const to_add: string[] = (!Array.isArray(followers_of_user_id) ? [followers_of_user_id] : followers_of_user_id);

            for (const user of to_add) {
                const followers = await User.getFollowersOf(user);
                for (const f of followers) { followers_of.add(f); }
            }

            if (query.user_owner) {
                // Ajoute au set les/l'utilisateur(s) déjà demandés
                if (typeof query.user_owner === 'string') {
                    followers_of.add(query.user_owner);
                }
                else {
                    for (const f of query.user_owner.$in) { followers_of.add(f); }
                }
            }

            query.user_owner = { $in: [...followers_of] };
        }

        if (since_id) {
            query.id = { $gt: Long.fromString(since_id) };
        }
        if (max_id) {
            if (query.id) {
                query.id.$lte = Long.fromString(max_id);
            }
            else {
                query.id = { $lte: Long.fromString(max_id) };
            }
        }

        // Requête !
        const results = await Database.get(MEOWS_COLL, query, { limit: count }, true);

        return Promise.all(results.map(m => this.constructDatabaseMeowToRealMeow(m, logged_user)));
    }
}