"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = require("fs");
const constants_1 = require("./constants");
exports.default = new class {
    generate(data, expires_in = 365 * 10) {
        data.exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * expires_in);
        return new Promise((resolve, reject) => {
            jsonwebtoken_1.default.sign(data, this.key, {
                algorithm: 'RS2048'
            }, (err, token) => {
                if (err)
                    reject(err);
                resolve(token);
            });
        });
    }
    verify(token) {
        return new Promise((resolve, reject) => {
            jsonwebtoken_1.default.verify(token, this.key, { algorithms: ['RS2048'] }, (err, decoded) => {
                if (err) {
                    if (err.message === "TokenExpiredError") {
                        // Le token a expiré
                    }
                    reject(err);
                }
                resolve(decoded);
            });
        });
    }
    get key() {
        if (this.publickey) {
            return this.publickey;
        }
        return this.publickey = fs_1.readFileSync(constants_1.PRIVATE_KEY_CERT).toString();
    }
};
