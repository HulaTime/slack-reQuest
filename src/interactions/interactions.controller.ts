import { Request } from 'express';
import { Logger } from 'pino';

import InteractionPayload, { RadioButtonActionState } from '../lib/slack/messages/InteractionPayload';
import { ActionIdentifiers } from '../common/identifiers';
import QueueDataMapper, { QueueInsert } from '../datamappers/QueueDatamapper';

export default class InteractionsController {
  private readonly interactionPayload: InteractionPayload;

  private readonly logger: Logger;

  constructor(req: Request, logger: Logger) {
    this.interactionPayload = new InteractionPayload(JSON.parse(req.body.payload));
    console.log('---------- this.interactionPayload ----------', JSON.stringify(this.interactionPayload, null, 2));
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
        const selectQueueTypeState = this.interactionPayload
          .getActionState(ActionIdentifiers.selectQueueType) as RadioButtonActionState;
        const selectQueueOwnerState = this.interactionPayload
          .getActionState(ActionIdentifiers.selectQueueOwner) as RadioButtonActionState;

        if (!selectQueueTypeState || !selectQueueOwnerState) {
          this.logger.error({ selectQueueTypeState, selectQueueOwnerState }, 'Could not identify required state values for queue creation');
          throw new Error('No identifiable queue state or owner');
        }

        const queueName = selectQueueTypeState.selected_option.value;
        const queueOwner = selectQueueOwnerState.selected_option.value;

        const queueDataMapper = new QueueDataMapper(this.logger);
        const queueData: QueueInsert = {
          name: queueName,
          userId: this.interactionPayload.userId,
          type: queueOwner === 'user' ? 'user' : 'channel',
        };
        if (queueOwner === 'channel') {
          queueData.channelId = this.interactionPayload.channelId; 
        }
        await queueDataMapper.create(queueData);
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
