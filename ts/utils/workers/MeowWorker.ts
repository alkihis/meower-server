import { User } from "../User";
import { PartialMeow, Meow } from "meower-interfaces";
import { simpleflake as snowflake } from 'simpleflakes';
import { MessageChannel, Worker, isMainThread } from 'worker_threads';
import MeowGetter from "../meows/MeowGetter";

export const MEOW_WORKER = isMainThread ? new Worker(__dirname + "/utils/workers/meow_worker.js") : undefined;

export default new class {
    async post(text: string, user: User, {
        media_ids = [],
        in_reply_to_id = "",
        quoted_status = "",
        remeow_of = ""
    } = {}) : Promise<Meow> {
        const meow: PartialMeow = {
            user_owner: user.id,
            text,
            quote_of: quoted_status ? quoted_status : undefined,
            remeow_of: remeow_of ? remeow_of : undefined,
            id: snowflake().toString(),
            in_reply_to_status_id: null,
            in_reply_to_user_id: null,
            created_at: new Date
        };

        if (in_reply_to_id) {
            // Check if tweet exists
            const reply = await MeowGetter.fromId(in_reply_to_id);

            if (reply) {
                meow.in_reply_to_status_id = in_reply_to_id;
                meow.in_reply_to_user_id = reply.user_owner;
            }
        }

        // TODO Gérer médias

        // Passage au thread
        const sub_channel = new MessageChannel;
        
        return new Promise(resolve => {
            MEOW_WORKER.postMessage({ port: sub_channel.port1, meow }, [sub_channel.port1]);

            sub_channel.port2.on('message', (value: number | Meow) => {
                console.log('received:', value);
    
                if (typeof value === 'number') {
                    // Error
                    throw value;
                }

                resolve(value);
            });
        });
    }

    async remeow(id: string, user: User) : Promise<Meow> {
        const original = await MeowGetter.fromId(id);

        return this.post(
            `RM @${original.user.screen_name}: ${original.text}`, 
            user, 
            { remeow_of: original.id }
        );
    }
};