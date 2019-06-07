import Express from 'express';
import SendMeowRouter from './send';

const router = Express.Router();

router.use('/send.json', SendMeowRouter);

export default router;
