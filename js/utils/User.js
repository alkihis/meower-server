"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Database_1 = __importDefault(require("./Database"));
const constants_1 = require("./constants");
const Errors_1 = __importDefault(require("./Errors"));
const simpleflakes_1 = require("simpleflakes");
class User {
    constructor(user_obj) {
        this.data = user_obj;
    }
    static fromId(id) {
        return this.getFromDatabase(id.toString());
    }
    static async fromScreenName(screen_name) {
        try {
            const user = await Database_1.default.getOne(constants_1.USER_COLL, { screen_name }, undefined, true);
            if (user) {
                return new User(await this.partialToComplete(user));
            }
        }
        catch (e) {
            throw e;
        }
        throw Errors_1.default.user_not_found;
    }
    static async getFromDatabase(id) {
        try {
            const user = await Database_1.default.getOne(constants_1.USER_COLL, { id }, undefined, true);
            if (user) {
                return new User(await this.partialToComplete(user));
            }
        }
        catch (e) {
            throw e;
        }
        throw Errors_1.default.user_not_found;
    }
    update(field, value, options) {
        return Database_1.default.collection(constants_1.USER_COLL).updateOne({ id: this.data.id }, { [field]: value }, options).catch(err => {
            // TODO log error
            throw err;
        });
    }
    // Return User ID
    static async create({ name = "", screen_name = "", bio = "", location = "", url = "" } = {}) {
        const new_id = simpleflakes_1.simpleflake().toString();
        if (!name || !screen_name || !name.match(constants_1.REALNAME_REGEX) || !screen_name.match(constants_1.USERNAME_REGEX) || bio.length > constants_1.BIO_LEN) {
            throw Errors_1.default.invalid_user_data;
        }
        const user_db = {
            name,
            screen_name,
            bio,
            location,
            url,
            id: new_id,
            protected: false,
            verified: false,
            medias: {
                is_default: true,
                picture: null,
                banner: null
            },
            created_at: new Date
        };
        const res = await Database_1.default.collection(constants_1.USER_COLL).insertOne(user_db).catch(err => {
            // TODO log error
            throw err;
        });
        return new User(await this.partialToComplete(res.ops[0]));
    }
    static async partialToComplete(user) {
        if (user.created_at instanceof Date) {
            user.created_at = user.created_at.toISOString();
        }
        return Object.assign({
            followers_count: await this.getFollowerCountOf(user.id),
            followings_count: await this.getFollowingCountOf(user.id),
            favourites_count: await this.getFavoritesCountOf(user.id)
        }, user);
    }
    static getFollowerCountOf(user_id) {
        return Database_1.default.collection(constants_1.FOLLOWERS_COLL).countDocuments({
            followed: user_id
        });
    }
    static getFollowingCountOf(user_id) {
        return Database_1.default.collection(constants_1.FOLLOWERS_COLL).countDocuments({
            follower: user_id
        });
    }
    static getFavoritesCountOf(user_id) {
        return Database_1.default.collection(constants_1.FAV_COLL).countDocuments({
            emitter: user_id
        });
    }
    static async isFollowing(follower, followed) {
        const is_followed = await Database_1.default.getOne(constants_1.FOLLOWERS_COLL, {
            followed,
            follower
        });
        return !!is_followed;
    }
    static async getRelationshipBetween(user_1, user_2) {
        return {
            following: await this.isFollowing(user_1, user_2),
            followed: await this.isFollowing(user_2, user_1),
            notifications: false,
            follow_request_sent: false
        };
    }
    async getRelationship(with_user_id) {
        return this.data.relationship = await User.getRelationshipBetween(this.id, with_user_id);
    }
    static async follow(follower, followed) {
        if (followed === follower) {
            throw Errors_1.default.bad_follow;
        }
        if (!(await this.isFollowing(follower, followed))) {
            const res = await Database_1.default.insertTo(constants_1.FOLLOWERS_COLL, {
                follower, followed, created_at: new Date
            });
            if (res[0]) {
                return true;
            }
            return false;
        }
        // ne rien faire
    }
    follow(user_id) {
        return User.follow(this.id, user_id);
    }
    static async unfollow(follower, followed) {
        if (await this.isFollowing(follower, followed)) {
            const res = await Database_1.default.collection(constants_1.FOLLOWERS_COLL).deleteOne({
                follower, followed
            });
            if (res.deletedCount) {
                return true;
            }
            return false;
        }
        // ne rien faire
    }
    unfollow(user_id) {
        return User.unfollow(this.id, user_id);
    }
    static async getIdFromScreenName(screen_name) {
        const res = await Database_1.default.getOne(constants_1.USER_COLL, {
            screen_name
        });
        if (res) {
            return res.id;
        }
        return undefined;
    }
    static async getScreenNameFromId(id) {
        const res = await Database_1.default.getOne(constants_1.USER_COLL, {
            id
        });
        if (res) {
            return res.screen_name;
        }
        return undefined;
    }
    static getFollowersOf(id) {
        return Database_1.default.get(constants_1.FOLLOWERS_COLL, { follower: id }, undefined, true);
    }
    async getFollowers() {
        if (!this.followers) {
            const follows = await User.getFollowersOf(this.id);
            this.followers = follows.map(r => r.followed);
        }
        return this.followers;
    }
    static getFollowingsOf(id) {
        return Database_1.default.get(constants_1.FOLLOWERS_COLL, { followed: id }, undefined, true);
    }
    async getFollowings() {
        if (!this.followings) {
            const follows = await User.getFollowingsOf(this.id);
            this.followings = follows.map(r => r.follower);
        }
        return this.followings;
    }
    toString() {
        return JSON.stringify(this.data);
    }
    get as_obj() {
        return this.data;
    }
    get id() {
        return this.data.id;
    }
    get numeric_id() {
        return BigInt(this.id);
    }
    get screen_name() {
        return this.data.screen_name;
    }
    set screen_name(v) {
        if (!v.match(constants_1.USERNAME_REGEX)) {
            throw Errors_1.default.invalid_username;
        }
        this.data.screen_name = v;
        // Mettre à jour la base
        this.update('screen_name', v);
    }
    get name() {
        return this.data.name;
    }
    set name(v) {
        if (!v.match(constants_1.REALNAME_REGEX)) {
            throw Errors_1.default.bad_name;
        }
        this.data.name = v;
        // Mettre à jour la base
        this.update('name', v);
    }
    get created_at() {
        return this.data.created_at;
    }
}
exports.User = User;
