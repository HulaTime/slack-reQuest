import { Request } from 'express';
import { Logger } from 'pino';

import InteractionPayload, { RadioButtonActionState } from '../lib/slack/messages/InteractionPayload';
import { ActionIdentifiers } from '../common/identifiers';
import QueueDataMapper from '../datamappers/QueueDatamapper';

export default class InteractionsController {
  private readonly interactionPayload: InteractionPayload;

  private readonly logger: Logger;

  constructor(req: Request, logger: Logger) {
    this.interactionPayload = new InteractionPayload(JSON.parse(req.body.payload));
    this.logger = logger;
  }

  async execute(): Promise<void> {
    if (this.interactionPayload.hasMultipleActions) {
      this.logger.warn('Interaction payloads with multiple primary actions are not yet supported');
      return;
    }
    const actionId = this.interactionPayload.getActionId();
    switch (actionId) {
      case ActionIdentifiers.submitQueueType: {
        this.logger.info('Handling submission of a queue type');
        const state = this.interactionPayload.getActionState(actionId);
        const radioButtonState = state[ActionIdentifiers.selectQueueType] as RadioButtonActionState;
        const queueName = radioButtonState.selected_option.value;
        const queueDataMapper = new QueueDataMapper(this.logger);
        await queueDataMapper.create({
          name: queueName,
          userId: this.interactionPayload.userId,
        });
        return;
      }
      default: {
        this.logger.warn(
          { actionId },
          `Interaction payload with actionId "${actionId}" is not currently supported`,
        );
      }
    }
  }
} 
