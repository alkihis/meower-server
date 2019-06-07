import { parentPort } from 'worker_threads';
import Errors from '../utils/Errors';
import { PartialMeow, Meow } from 'meower-interfaces';
import Database from '../utils/Database';
import { DATABASE_URL, MEOWS_COLL } from '../utils/constants';
import { Long } from 'mongodb';
import MeowGetter from '../utils/meows/MeowGetter';

// Module de traitement d'un tweet
(async () => {
    await Database.init(DATABASE_URL);

    parentPort.on('message', async (value) => {
        if (value && value.port instanceof MessagePort) {
            if (!value.meow) {
                value.port.postMessage(Errors.invalid_message);
            }
            else {
                const tweet: PartialMeow = value.meow;
    
                // Traiter le meow, le sauvegarder en base de données.
                try {
                    const real_meow = await makeRealMeow(tweet);

                    value.port.postMessage({ meow: real_meow });
                } catch (e) {
                    value.port.postMessage(Errors.database_error);
                }
    
            }
            
            value.port.close();
        }
    });
})();

async function makeRealMeow(meow: PartialMeow) : Promise<Meow> {
    if (typeof meow.id === 'string') {
        // @ts-ignore
        meow.id = Long.fromString(meow.id);
    }
    if (typeof meow.in_reply_to_status_id === 'string') {
        // @ts-ignore
        meow.in_reply_to_status_id = Long.fromString(meow.in_reply_to_status_id);
    }

    // Save the meow in database
    await Database.insertTo(MEOWS_COLL, meow);

    // Récupère le meow
    const final_meow = await MeowGetter.fromId(meow.id.toString());
    final_meow.remeowed = false; final_meow.favorited = false;

    return final_meow;
}
