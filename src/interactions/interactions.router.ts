import { Router } from 'express';

import QueueDataMapper from '../datamappers/QueueDatamapper';
import { ActionIdentifiers } from '../common/identifiers';

const router = Router();

type InteractionPayload = {
  user: {
    id: string;
  };
  actions: Array<{
    block_id: string;
    action_id: string;
  }>;
  state: {
    values: {
      [block_id: string]: {
        [interaction_type: string]: {
          type: 'radio_buttons';
          selected_option: {
            text: {
              type: string;
              text: string;
              emoji: boolean;
            };
            value: string;
          };
        };
      };
    };

  };
}

router.post('/interactions', async (req, res, next) => {
  try {
    const { body, log: logger } = req;
    logger.info({ body }, 'Inbound request to interactions endpoint');

    const interactionPayload: InteractionPayload = JSON.parse(body.payload);
    const {
      user: { id: userId },
      actions,
      state,
    } = interactionPayload;

    const [primaryAction] = actions;
    if (primaryAction.action_id === ActionIdentifiers.submitQueueType) {
      const stateValue = state.values[primaryAction.block_id][ActionIdentifiers.selectQueueType];
      logger.info({ stateValue });
      const queueName = stateValue.selected_option.value;
      const queueDataMapper = new QueueDataMapper(logger);
      await queueDataMapper.create({
        name: queueName,
        userId,
      });
    }

    res.status(201).end();
  } catch (err) {
    req.log.error({ err }, 'Failed to process create queue request');
    next(err);
  }
});

export default router;

