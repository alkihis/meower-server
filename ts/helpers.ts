import { NextFunction, Request, Response } from "express";
import { LoggedUser } from "./utils/LoggedUser";
import { EXPRESS_LOGGED_USER, PASSWORD_PASS_SALT_ROUNDS, URL_REGEX, MENTIONS_REGEX, HASHTAG_REGEX } from "./utils/constants";
import bcrypt from 'bcrypt';
import { PartialMeow, Entities, URLEntity, UserMentionEntity, HashtagEntity } from "meower-interfaces";
import { User } from "./utils/User";
import Errors from "./utils/Errors";

export async function login(req: Request, _: Response, next: NextFunction) {
    if (req.headers.authorization) {
        // get bearer
        const bearer = req.headers.authorization.split(' ')[1];

        if (bearer) {
            req[EXPRESS_LOGGED_USER] = await LoggedUser.from(bearer);
        }
    }

    next();
}

export async function passwordHash(password: string) {
    return new Promise(resolve => {
        bcrypt.hash(password, PASSWORD_PASS_SALT_ROUNDS, (err, hash) => {
            if (err) throw err;

            resolve(hash);
        });
    });
}

export async function passwordVerify(password: string, hash: string) {
    return new Promise(resolve => {
        bcrypt.compare(password, hash, (err, hash) => {
            if (err) throw err;

            resolve(hash);
        });
    });
}

export async function constructMeowEntities(meow: PartialMeow) : Promise<Entities> {
    /// TODO MEDIA SUPPORT
    const entities: Entities = {
        medias: [],
        urls: parseMeowUrls(meow),
        mentions: await parseMeowMentions(meow),
        hashtags: parseMeowHashtags(meow)
    };

    return entities;
}

export function parseMeowUrls(meow: PartialMeow) : URLEntity[] {
    const text = meow.text;

    const regex_url = new RegExp(URL_REGEX);
    const url_entities: URLEntity[] = [];

    let match: RegExpExecArray;
    while (match = regex_url.exec(text)) {
        const url = match.groups[0];
        const positions = [match.index, match.index + url.length] as [number, number];
        
        url_entities.push({
            positions,
            url,
            display_url: makeDisplayUrlFromUrl(url)
        });
    }

    return url_entities;
}

export function makeDisplayUrlFromUrl(url: string) {
    // TODO
    return url;
}

export async function parseMeowMentions(meow: PartialMeow) : Promise<UserMentionEntity[]> {
    const text = meow.text;

    const regex_url = new RegExp(MENTIONS_REGEX);
    const entities: UserMentionEntity[] = [];

    let match: RegExpExecArray;
    while (match = regex_url.exec(text)) {
        const mention = match.groups[0];
        const screen_name = mention.split('@')[1];
        const positions = [match.index, match.index + mention.length] as [number, number];
        
        // Test si l'utilisateur existe
        try {
            const user = await User.fromScreenName(screen_name);

            entities.push({
                positions,
                screen_name,
                name: user.name,
                id: user.id
            });
        } catch (e) {
            if (e === Errors.user_not_found) {
                // n'existe pas, pass
            }
            else {
                throw e;
            }
        }
    }

    return entities;
}

export function parseMeowHashtags(meow: PartialMeow) : HashtagEntity[] {
    const text = meow.text;

    const regex_url = new RegExp(HASHTAG_REGEX);
    const entities: HashtagEntity[] = [];

    let match: RegExpExecArray;
    while (match = regex_url.exec(text)) {
        const hashtag = match.groups[0];
        const positions = [match.index, match.index + hashtag.length] as [number, number];
        
        entities.push({
            positions,
            hashtag
        });
    }

    return entities;
}
