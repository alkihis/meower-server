"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const index_1 = require("./index");
commander_1.default
    .option("-p, --port <portNumber>", "The port number", parseInt, 3280)
    .parse(process.argv);
index_1.main(commander_1.default.port);
