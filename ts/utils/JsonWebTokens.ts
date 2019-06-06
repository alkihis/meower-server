import jsonwebtoken from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { PRIVATE_KEY_CERT } from './constants';

export interface JsonWebTokenData {
    idu: string;
    exp?: number;
}

export default new class {
    protected publickey: string;

    generate(data: JsonWebTokenData, expires_in: number = 365 * 10) {
        data.exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * expires_in);

        return new Promise((resolve, reject) => {
            jsonwebtoken.sign(data, this.key, {
                algorithm: 'RS2048'
            }, (err, token) => {
                if (err) reject(err);
                resolve(token);
            });
        }) as Promise<string>;
    }

    verify(token: string) {
        return new Promise((resolve, reject) => {
            jsonwebtoken.verify(token, this.key, { algorithms: ['RS2048'] }, (err, decoded) => {
                if (err) {
                    if (err.message === "TokenExpiredError") {
                        // Le token a expiré
                    }
                    reject(err);
                }
                resolve(decoded as JsonWebTokenData);
            });
        }) as Promise<JsonWebTokenData>;
    }

    get key() {
        if (this.publickey) {
            return this.publickey;
        }

        return this.publickey = readFileSync(PRIVATE_KEY_CERT).toString();
    }
};