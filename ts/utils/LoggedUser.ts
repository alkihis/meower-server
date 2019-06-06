import JsonWebTokens, { JsonWebTokenData } from "./JsonWebTokens";
import { User } from "./User";
import Database from "./Database";
import { USERDATA_COLL, TOKENS_COLL, EMAIL_REGEX, PASSWORD_REGEX } from "./constants";
import Errors from "./Errors";
import { passwordVerify, passwordHash } from "../helpers";
import { Token } from "../interfaces/LoginInformations";
import { simpleflake as snowflake } from 'simpleflakes';

export class LoggedUser {
    protected constructor(
        protected user: User, 
        protected token_infos: JsonWebTokenData
    ) { }

    static async from(token: string) {
        const data = await JsonWebTokens.verify(token);

        return new LoggedUser(await User.fromId(data.idu), data);
    }

    protected static async directFrom(user_obj: User, token: Token) {
        const data = await JsonWebTokens.verify(token.token);

        return new LoggedUser(user_obj, data);
    }

    static async fromCredentials(email_or_screen_name: string, password: string) {
        if (!email_or_screen_name.includes('@')) {
            // screen_name
            const id = await User.getIdFromScreenName(email_or_screen_name);

            if (!id) {
                throw Errors.user_not_found;
            }
            email_or_screen_name = await this.getEmailFromId(id);
        } 

        const hash = (await Database.getOne(USERDATA_COLL, {
            email: email_or_screen_name
        })).password;

        // Decode hash
        if (await passwordVerify(password, hash)) {
            
        }
        throw Errors.invalid_password;
    }

    static async getEmailFromId(id: string) {
        const res = await Database.getOne(USERDATA_COLL, {
            id
        });

        if (res) {
            return res.email as string;
        }
        return undefined;
    }

    static async getIdFromEmail(email: string) {
        const res = await Database.getOne(USERDATA_COLL, {
            email
        });

        if (res) {
            return res.id as string;
        }
        return undefined;
    }

    async getToken() {
        const res = await Database.getOne(TOKENS_COLL, {
            user_id: this.info.id
        });

        if (res) {
            return res as Token;
        }
        // Create a token
        return LoggedUser.createToken(this.info.id);
    }

    protected static async createToken(user_id: string) {
        const data: JsonWebTokenData = {
            idu: user_id
        };

        const token = await JsonWebTokens.generate(data);

        // Insère le token
        const token_info: Token = {
            user_id: user_id,
            token,
            token_id: snowflake().toString(),
            token_exp: data.exp
        };
        const [res, , ] = await Database.insertTo(TOKENS_COLL, token_info);

        if (res) {
            return res;
        }
        throw Errors.token_creation_fail;
    }

    static async create({
        name = "", 
        screen_name = "", 
        bio = "", 
        location = "",
        url = "",
        email = "",
        password = ""
    } = {}) {
        if (!email.match(EMAIL_REGEX)) {
            throw Errors.bad_email;
        }
        if (!password.match(PASSWORD_REGEX)) {
            throw Errors.bad_password;
        }

        const user_created = await User.create({ name, screen_name, bio, location, url });
        const new_token = await this.createToken(user_created.id);

        const [res, ,] = await Database.insertTo(USERDATA_COLL, {
            email,
            password: await passwordHash(password),
            id: user_created.id
        });

        if (res) {
            return this.directFrom(user_created, new_token);
        }

        throw Errors.database_error;
    }

    get info() {
        return this.user;
    }
}