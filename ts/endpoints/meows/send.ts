import Express from 'express';
import { simpleflake as snowflake } from 'simpleflakes';
import Database from '../../utils/Database';
import { MEOWS_COLL } from '../../utils/constants';

const router = Express.Router();

router.post('/', async (req, res) => {
    console.log(req.body)
    if (req.body.text && req.body.username) {
        const id = snowflake();

        const [result, , ] = await Database.insertTo(MEOWS_COLL, {
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

export default router;
