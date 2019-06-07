"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const simpleflakes_1 = require("simpleflakes");
const worker_threads_1 = require("worker_threads");
const MeowGetter_1 = __importDefault(require("../meows/MeowGetter"));
exports.MEOW_WORKER = worker_threads_1.isMainThread ? new worker_threads_1.Worker(__dirname + "/utils/workers/meow_worker.js") : undefined;
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
            const reply = await MeowGetter_1.default.fromId(in_reply_to_id);
            if (reply) {
                meow.in_reply_to_status_id = in_reply_to_id;
                meow.in_reply_to_user_id = reply.user_owner;
            }
        }
        // TODO Gérer médias
        // Passage au thread
        const sub_channel = new worker_threads_1.MessageChannel;
        return new Promise(resolve => {
            exports.MEOW_WORKER.postMessage({ port: sub_channel.port1, meow }, [sub_channel.port1]);
            sub_channel.port2.on('message', (value) => {
                console.log('received:', value);
                if (typeof value === 'number') {
                    // Error
                    throw value;
                }
                resolve(value);
            });
        });
    }
    async remeow(id, user) {
        const original = await MeowGetter_1.default.fromId(id);
        return this.post(`RM @${original.user.screen_name}: ${original.text}`, user, { remeow_of: original.id });
    }
};
