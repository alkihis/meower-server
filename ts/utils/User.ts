import Database from "./Database";
import { USER_COLL, USERNAME_REGEX, REALNAME_REGEX, BIO_LEN, FOLLOWERS_COLL, FAV_COLL } from "./constants";
import * as Meower from 'meower-interfaces';
import Errors from "./Errors";
import { UpdateOneOptions } from "mongodb";
import { simpleflake as snowflake } from 'simpleflakes';
import { DetailedRelationship } from "meower-interfaces/js/user";

export class User {
    protected data: Meower.User;
    protected followers: string[];
    protected followings: string[];

    protected constructor(user_obj: Meower.User) {
        this.data = user_obj;
    }

    static fromId(id: string | BigInt | Number) {
        return this.getFromDatabase(id.toString());
    }

    static async fromScreenName(screen_name: string) {
        try {
            const user = await Database.getOne(USER_COLL, { screen_name }, undefined, true);

            if (user) {
                return new User(await this.partialToComplete(user));
            }
        } catch (e) {
            throw e;
        }

        throw Errors.user_not_found;
    }

    protected static async getFromDatabase(id: string) : Promise<User> {
        try {
            const user = await Database.getOne(USER_COLL, { id }, undefined, true);

            if (user) {
                return new User(await this.partialToComplete(user));
            }
        } catch (e) {
            throw e;
        }

        throw Errors.user_not_found;
    }

    protected update(field: string, value: any, options?: UpdateOneOptions) {
        return Database.collection(USER_COLL).updateOne(
            { id: this.data.id }, 
            { [field]: value }, 
            options
        ).catch(err => {
            // TODO log error

            throw err;
        });
    }

    // Return User ID
    public static async create({
        name = "", 
        screen_name = "", 
        bio = "", 
        location = "",
        url = ""
    } = {}) : Promise<User> {
        const new_id: string = snowflake().toString();

        if (!name || !screen_name || !name.match(REALNAME_REGEX) || !screen_name.match(USERNAME_REGEX) || bio.length > BIO_LEN) {
            throw Errors.invalid_user_data;
        }

        const user_db: Meower.PartialUser = { 
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
        }

        const res = await Database.collection(USER_COLL).insertOne(user_db).catch(err => {
            // TODO log error

            throw err;
        });

        return new User(await this.partialToComplete(res.ops[0]));
    }

    static async partialToComplete(user: Meower.PartialUser) : Promise<Meower.User> {
        if (user.created_at instanceof Date) {
            user.created_at = user.created_at.toISOString();
        }

        return Object.assign({
            followers_count: await this.getFollowerCountOf(user.id),
            followings_count: await this.getFollowingCountOf(user.id),
            favourites_count: await this.getFavoritesCountOf(user.id)
        }, user);
    }

    static getFollowerCountOf(user_id: string) {
        return Database.collection(FOLLOWERS_COLL).countDocuments({
            followed: user_id 
        });
    }

    static getFollowingCountOf(user_id: string) {
        return Database.collection(FOLLOWERS_COLL).countDocuments({
            follower: user_id 
        });
    }

    static getFavoritesCountOf(user_id: string) {
        return Database.collection(FAV_COLL).countDocuments({
            emitter: user_id 
        });
    }

    static async isFollowing(follower: string, followed: string) {
        const is_followed = await Database.getOne(FOLLOWERS_COLL, {
            followed,
            follower
        });

        return !!is_followed;
    }

    static async getRelationshipBetween(user_1: string, user_2: string) : Promise<Meower.Relationship> {
        return {
            following: await this.isFollowing(user_1, user_2),
            followed: await this.isFollowing(user_2, user_1),
            notifications: false,
            follow_request_sent: false
        };
    }

    async getRelationship(with_user_id: string) {
        return this.data.relationship = await User.getRelationshipBetween(this.id, with_user_id);
    }

    static async follow(follower: string, followed: string) {
        if (followed === follower) {
            throw Errors.bad_follow;
        }

        if (!(await this.isFollowing(follower, followed))) {
            const res = await Database.insertTo(FOLLOWERS_COLL, {
                follower, followed, created_at: new Date
            });

            if (res[0]) {
                return true;
            }
            return false;
        }

        // ne rien faire
    }

    follow(user_id: string) {
        return User.follow(this.id, user_id);
    }

    static async unfollow(follower: string, followed: string) {
        if (await this.isFollowing(follower, followed)) {
            const res = await Database.collection(FOLLOWERS_COLL).deleteOne({
                follower, followed
            });

            if (res.deletedCount) {
                return true;
            }
            return false;
        }

        // ne rien faire
    }

    unfollow(user_id: string) {
        return User.unfollow(this.id, user_id);
    }

    static async getIdFromScreenName(screen_name: string) {
        const res = await Database.getOne(USER_COLL, {
            screen_name
        });

        if (res) {
            return res.id as string;
        }
        return undefined;
    }

    static async getScreenNameFromId(id: string) {
        const res = await Database.getOne(USER_COLL, {
            id
        });

        if (res) {
            return res.screen_name as string;
        }
        return undefined;
    }

    static getFollowersOf(id: string) {
        return Database.get(FOLLOWERS_COLL, { follower: id }, undefined, true);
    }

    async getFollowers() {
        if (!this.followers) {
            const follows: DetailedRelationship[] = await User.getFollowersOf(this.id);

            this.followers = follows.map(r => r.followed);
        }

        return this.followers;
    }

    static getFollowingsOf(id: string) {
        return Database.get(FOLLOWERS_COLL, { followed: id }, undefined, true);
    }

    async getFollowings() {
        if (!this.followings) {
            const follows: DetailedRelationship[] = await User.getFollowingsOf(this.id);

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

    set screen_name(v: string) {
        if (!v.match(USERNAME_REGEX)) {
            throw Errors.invalid_username;
        }

        this.data.screen_name = v;
        // Mettre à jour la base
        this.update('screen_name', v);
    }

    get name() {
        return this.data.name;
    }

    set name(v: string) {
        if (!v.match(REALNAME_REGEX)) {
            throw Errors.bad_name;
        }

        this.data.name = v;
        // Mettre à jour la base
        this.update('name', v);
    }

    get created_at() : string {
        return this.data.created_at as string;
    }
}

