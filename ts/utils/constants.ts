export const DB_NAME = 'meower';
export const PRIVATE_KEY_CERT = __dirname + '/../assets/key.pem';

export const USER_COLL = "users";
export const MEOWS_COLL = "meows";
export const FOLLOWERS_COLL = "followers";
export const FAV_COLL = "favs";
export const USERDATA_COLL = "logininfos";
export const TOKENS_COLL = "tokens";

export const USERNAME_REGEX = /^[a-z][a-z0-9_]{1,15}$/ui;
export const REALNAME_REGEX = /^[^\n<>\t\r]{1,32}$/u;
export const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const PASSWORD_REGEX = /.{8,}/;
export const BIO_LEN = 300;

export const PASSWORD_PASS_SALT_ROUNDS = 10;

export const EXPRESS_LOGGED_USER = 'logged_user';
