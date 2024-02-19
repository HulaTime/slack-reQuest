import { Router } from 'express';

const router = Router();

router.post('/queues', (req, res, next) => {
  try {
    req.log.debug({ body: req.body }, 'Received create queue request');
    res.status(200).end();
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

export default router;

