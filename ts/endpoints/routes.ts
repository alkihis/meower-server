import Express from 'express';
import MeowsRouter from './meows/routes';

const router = Express.Router();

router.use('/meows', MeowsRouter);

export default router;
