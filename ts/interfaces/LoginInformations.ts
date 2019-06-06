export interface LoginInformations {
    email: string;
    password: string;
    id: string;
}

export interface Token {
    token_id: string;
    token_exp: number;
    token: string;
    user_id: string;
}
