"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const simpleflakes_1 = require("simpleflakes");
const Database_1 = __importDefault(require("../../utils/Database"));
const index_1 = require("../../index");
const constants_1 = require("../../utils/constants");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    console.log(req.body);
    if (req.body.text && req.body.username) {
        const id = simpleflakes_1.simpleflake();
        const [result, ,] = await Database_1.default.insertTo(constants_1.MEOWS_COLL, {
            id_str: id.toString(),
            text: req.body.text,
            user: {
                id: 1,
                id_str: "1",
                screen_name: req.body.username
            }
        });
        res.status(200).json(result);
    }
    else {
        ///// error
        res.status(400).send();
    }
});
index_1.SERVER.use('/meows/send.json', router);
