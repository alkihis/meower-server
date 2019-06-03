import commander from 'commander';
import { main } from './index';

commander
    .option("-p, --port <portNumber>", "The port number", parseInt, 3280)
.parse(process.argv);

main(commander.port);

