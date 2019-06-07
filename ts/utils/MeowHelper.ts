import { User } from "./User";
import MeowWorker from "./workers/MeowWorker";
import { Meow } from "meower-interfaces";
import Database from "./Database";
import { MEOWS_COLL, FAV_COLL } from "./constants";
import { Long } from "bson";

export default new class {
    getReplyCountOf(id: string) {
        return Database.collection(MEOWS_COLL).countDocuments({
            in_reply_to_status_id: Long.fromString(id)
        });
    }

    getRemeowCountOf(id: string) {
        return Database.collection(MEOWS_COLL).countDocuments({
            remeow_of: id
        });
    }

    getFavoriteCountOf(id: string) {
        return Database.collection(FAV_COLL).countDocuments({
            meow: id 
        });
    }

    async hasRemeow(user_id: string, meow_id: string) {
        const exists = await Database.getOne(MEOWS_COLL, {
            user_owner: user_id, remeow_of: meow_id
        });

        return !!exists;
    }

    async hasFavorited(user_id: string, meow_id: string) {
        const exists = await Database.getOne(FAV_COLL, {
            emitter: user_id, meow: meow_id
        });

        return !!exists;
    }
}