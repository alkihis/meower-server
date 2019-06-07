"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = __importDefault(require("commander"));
const index_1 = __importDefault(require("./index"));
commander_1.default
    .option("-p, --port <portNumber>", "The port number", parseInt, 3280)
    .option("-u, --url <url>", "The mongoDB server URL", "mongodb://localhost:3281")
    .parse(process.argv);
index_1.default(commander_1.default.port);
