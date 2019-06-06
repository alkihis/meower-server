import { NextFunction, Request, Response } from "express";
import { LoggedUser } from "./utils/LoggedUser";
import { EXPRESS_LOGGED_USER, PASSWORD_PASS_SALT_ROUNDS } from "./utils/constants";
import bcrypt from 'bcrypt';

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
