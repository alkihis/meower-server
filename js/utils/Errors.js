"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Errors;
(function (Errors) {
    Errors[Errors["invalid_username"] = 0] = "invalid_username";
    Errors[Errors["user_not_found"] = 1] = "user_not_found";
    Errors[Errors["invalid_user_data"] = 2] = "invalid_user_data";
    Errors[Errors["invalid_password"] = 3] = "invalid_password";
    Errors[Errors["token_creation_fail"] = 4] = "token_creation_fail";
    Errors[Errors["bad_email"] = 5] = "bad_email";
    Errors[Errors["bad_password"] = 6] = "bad_password";
    Errors[Errors["database_error"] = 7] = "database_error";
})(Errors || (Errors = {}));
exports.default = Errors;
