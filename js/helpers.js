"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LoggedUser_1 = require("./utils/LoggedUser");
const constants_1 = require("./utils/constants");
const bcrypt_1 = __importDefault(require("bcrypt"));
const User_1 = require("./utils/User");
const Errors_1 = __importDefault(require("./utils/Errors"));
async function login(req, _, next) {
    if (req.headers.authorization) {
        // get bearer
        const bearer = req.headers.authorization.split(' ')[1];
        if (bearer) {
            req[constants_1.EXPRESS_LOGGED_USER] = await LoggedUser_1.LoggedUser.from(bearer);
        }
    }
    next();
}
exports.login = login;
async function passwordHash(password) {
    return new Promise(resolve => {
        bcrypt_1.default.hash(password, constants_1.PASSWORD_PASS_SALT_ROUNDS, (err, hash) => {
            if (err)
                throw err;
            resolve(hash);
        });
    });
}
exports.passwordHash = passwordHash;
async function passwordVerify(password, hash) {
    return new Promise(resolve => {
        bcrypt_1.default.compare(password, hash, (err, hash) => {
            if (err)
                throw err;
            resolve(hash);
        });
    });
}
exports.passwordVerify = passwordVerify;
async function constructMeowEntities(meow) {
    /// TODO MEDIA SUPPORT
    const entities = {
        medias: [],
        urls: parseMeowUrls(meow),
        mentions: await parseMeowMentions(meow),
        hashtags: parseMeowHashtags(meow)
    };
    return entities;
}
exports.constructMeowEntities = constructMeowEntities;
function parseMeowUrls(meow) {
    const text = meow.text;
    const regex_url = new RegExp(constants_1.URL_REGEX);
    const url_entities = [];
    let match;
    while (match = regex_url.exec(text)) {
        const url = match.groups[0];
        const positions = [match.index, match.index + url.length];
        url_entities.push({
            positions,
            url,
            display_url: makeDisplayUrlFromUrl(url)
        });
    }
    return url_entities;
}
exports.parseMeowUrls = parseMeowUrls;
function makeDisplayUrlFromUrl(url) {
    // TODO
    return url;
}
exports.makeDisplayUrlFromUrl = makeDisplayUrlFromUrl;
async function parseMeowMentions(meow) {
    const text = meow.text;
    const regex_url = new RegExp(constants_1.MENTIONS_REGEX);
    const entities = [];
    let match;
    while (match = regex_url.exec(text)) {
        const mention = match.groups[0];
        const screen_name = mention.split('@')[1];
        const positions = [match.index, match.index + mention.length];
        // Test si l'utilisateur existe
        try {
            const user = await User_1.User.fromScreenName(screen_name);
            entities.push({
                positions,
                screen_name,
                name: user.name,
                id: user.id
            });
        }
        catch (e) {
            if (e === Errors_1.default.user_not_found) {
                // n'existe pas, pass
            }
            else {
                throw e;
            }
        }
    }
    return entities;
}
exports.parseMeowMentions = parseMeowMentions;
function parseMeowHashtags(meow) {
    const text = meow.text;
    const regex_url = new RegExp(constants_1.HASHTAG_REGEX);
    const entities = [];
    let match;
    while (match = regex_url.exec(text)) {
        const hashtag = match.groups[0];
        const positions = [match.index, match.index + hashtag.length];
        entities.push({
            positions,
            hashtag
        });
    }
    return entities;
}
exports.parseMeowHashtags = parseMeowHashtags;
