import { Router } from 'express';
import { container } from 'tsyringe';

import { InteractionControllerToken } from '@Ioc/container';

const router = Router();

router.post('/interactions', async (req, res, next) => {
  try {
    const { body, log: logger } = req;
    logger.info( 'Inbound request to interactions endpoint',{ body });

    const controller = container.resolve(InteractionControllerToken)(req);
    const result = await controller.execute();
    logger.info( 'Successfully executed interaction',{ result });

    res.status(200).json(result);
  } catch (err) {
    req.log.error( 'Failed to process create queue request',{ err });
    next(err);
  }
});

export default router;

