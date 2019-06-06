import commander from 'commander';
import index from './index';

commander
    .option("-p, --port <portNumber>", "The port number", parseInt, 3280)
    .option("-u, --url <url>", "The mongoDB server URL", "mongodb://localhost:3281")
.parse(process.argv);

index(commander.port, commander.url);

