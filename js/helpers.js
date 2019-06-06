"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LoggedUser_1 = require("./utils/LoggedUser");
const constants_1 = require("./utils/constants");
const bcrypt_1 = __importDefault(require("bcrypt"));
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
