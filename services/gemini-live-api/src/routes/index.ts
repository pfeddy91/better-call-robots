import { Router } from 'express';
import { callsRouter } from './calls';
import { healthRouter } from './health';
import audioRouter from './audio';

const router = Router();

router.use('/api', callsRouter);
router.use('/health', healthRouter);
router.use('/audio', audioRouter);

export default router; 