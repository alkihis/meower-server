"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const JsonWebTokens_1 = __importDefault(require("./JsonWebTokens"));
const User_1 = require("./User");
const Database_1 = __importDefault(require("./Database"));
const constants_1 = require("./constants");
const Errors_1 = __importDefault(require("./Errors"));
const helpers_1 = require("../helpers");
const simpleflakes_1 = require("simpleflakes");
class LoggedUser {
    constructor(user, token_infos) {
        this.user = user;
        this.token_infos = token_infos;
    }
    static async from(token) {
        const data = await JsonWebTokens_1.default.verify(token);
        return new LoggedUser(await User_1.User.fromId(data.idu), data);
    }
    static async directFrom(user_obj, token) {
        const data = await JsonWebTokens_1.default.verify(token.token);
        return new LoggedUser(user_obj, data);
    }
    static async fromCredentials(email_or_screen_name, password) {
        if (!email_or_screen_name.includes('@')) {
            // screen_name
            const id = await User_1.User.getIdFromScreenName(email_or_screen_name);
            if (!id) {
                throw Errors_1.default.user_not_found;
            }
            email_or_screen_name = await this.getEmailFromId(id);
        }
        const hash = (await Database_1.default.getOne(constants_1.USERDATA_COLL, {
            email: email_or_screen_name
        })).password;
        // Decode hash
        if (await helpers_1.passwordVerify(password, hash)) {
        }
        throw Errors_1.default.invalid_password;
    }
    static async getEmailFromId(id) {
        const res = await Database_1.default.getOne(constants_1.USERDATA_COLL, {
            id
        });
        if (res) {
            return res.email;
        }
        return undefined;
    }
    static async getIdFromEmail(email) {
        const res = await Database_1.default.getOne(constants_1.USERDATA_COLL, {
            email
        });
        if (res) {
            return res.id;
        }
        return undefined;
    }
    async getToken() {
        const res = await Database_1.default.getOne(constants_1.TOKENS_COLL, {
            user_id: this.info.id
        });
        if (res) {
            return res;
        }
        // Create a token
        return LoggedUser.createToken(this.info.id);
    }
    static async createToken(user_id) {
        const data = {
            idu: user_id
        };
        const token = await JsonWebTokens_1.default.generate(data);
        // Insère le token
        const token_info = {
            user_id: user_id,
            token,
            token_id: simpleflakes_1.simpleflake().toString(),
            token_exp: data.exp
        };
        const [res, ,] = await Database_1.default.insertTo(constants_1.TOKENS_COLL, token_info);
        if (res) {
            return res;
        }
        throw Errors_1.default.token_creation_fail;
    }
    static async create({ name = "", screen_name = "", bio = "", location = "", url = "", email = "", password = "" } = {}) {
        if (!email.match(constants_1.EMAIL_REGEX)) {
            throw Errors_1.default.bad_email;
        }
        if (!password.match(constants_1.PASSWORD_REGEX)) {
            throw Errors_1.default.bad_password;
        }
        const user_created = await User_1.User.create({ name, screen_name, bio, location, url });
        const new_token = await this.createToken(user_created.id);
        const [res, ,] = await Database_1.default.insertTo(constants_1.USERDATA_COLL, {
            email,
            password: await helpers_1.passwordHash(password),
            id: user_created.id
        });
        if (res) {
            return this.directFrom(user_created, new_token);
        }
        throw Errors_1.default.database_error;
    }
    get info() {
        return this.user;
    }
}
exports.LoggedUser = LoggedUser;
