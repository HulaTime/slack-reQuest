import { Request } from 'express';
import { Logger } from 'pino';

import { ActionIdentifiers, BlockIdentifiers, MessageIdentifiers } from '../common/identifiers';
import QueueDataMapper, { QueueInsert } from '../datamappers/QueueDatamapper';
import { InteractionPayload, MessagePayload } from '../lib/slack/messagePayloads';
import HttpReq from '../lib/utils/HttpReq';

export default class InteractionsController {
  private readonly interactionPayload: InteractionPayload;

  private readonly logger: Logger;

  constructor(req: Request, logger: Logger) {
    this.interactionPayload = new InteractionPayload(JSON.parse(req.body.payload), logger);
    console.log('---------- this.interactionPayload ----------', JSON.stringify(this.interactionPayload, null, 2));
    this.logger = logger;
  }


  async execute(): Promise<void> {
    if (this.interactionPayload.hasMultipleActions) {
      this.logger.warn('Interaction payloads with multiple primary actions are not yet supported');
    }
    const actionId = this.interactionPayload.getActionId();
    switch (actionId) {
      case ActionIdentifiers.cancelInteraction: {
        const messagePayload = new MessagePayload(MessageIdentifiers.cancelInteraction, [])
          .shouldDeleteOriginal(true)
          .setNoContent();

        const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
        httpReq.setBody(messagePayload.render());
        await httpReq.post();

        return;
      }
      case ActionIdentifiers.selectQueueType: {
        this.logger.info('Handling submission of a queue type');
        const radioButtonActionState = this.interactionPayload
          .getRadioButtonState(BlockIdentifiers.selectQueueAction, BlockIdentifiers.selectQueueMenu);

        if (!radioButtonActionState) {
          this.logger.error({ queueRequestType: radioButtonActionState }, 'Could not identify required state values for queue creation');
          throw new Error('No identifiable queue state or owner');
        }

        const { selected_option: { value: queueName } } = radioButtonActionState;

        const queueDataMapper = new QueueDataMapper(this.logger);
        const queueData: QueueInsert = {
          name: queueName,
          userId: this.interactionPayload.userId,
          type: 'channel',
          channelId: this.interactionPayload.channelId,
        };
        await queueDataMapper.create(queueData);
        const msgPayload = new MessagePayload(`Successfully created the new queue "${queueName}"`, [])
          .shouldReplaceOriginal('true')
          .setResponseType('ephemeral');

        const result = await fetch(this.interactionPayload.responseUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(msgPayload.render()),
        });
        const parsedResult = await result.json();
        this.logger.info({ parsedResult, actionId, queueData }, 'Successfully responded after creating a new queue');

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
