import { Router } from 'express';

const router = Router();

router.post('/interactions', async (req, res, next) => {
  try {
    const { body, log: logger } = req;
    const interactionPayload = JSON.parse(body.payload);
    logger.info({ body }, 'Inbound request to interactions endpoint');
    const {
      actions,
      state,
    } = interactionPayload;

    const [primaryAction] = actions;
    if (primaryAction.action_id === 'submit-queue-type') {
      const something = state.values[primaryAction.block_id]['select-queue-type'];
      logger.info({ something });
    }

    res.status(201).json({});
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

export default router;

