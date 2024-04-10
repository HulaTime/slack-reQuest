import { Request } from 'express';
import { Logger } from 'pino';

import { ActionIdentifiers, BlockIdentifiers, MessageIdentifiers } from '../common/identifiers';
import QueueDataMapper, { QueueInsert } from '../datamappers/QueueDatamapper';
import { InteractionPayload, MessagePayload } from '../lib/slack/messagePayloads';
import HttpReq from '../lib/utils/HttpReq';

export default class InteractionsController {
  private readonly interactionPayload: InteractionPayload;

  private readonly logger: Logger;

  private readonly queueDataMapper: QueueDataMapper;

  constructor(req: Request, logger: Logger) {
    this.interactionPayload = new InteractionPayload(JSON.parse(req.body.payload), logger);
    this.logger = logger;
    this.queueDataMapper = new QueueDataMapper(logger);
  }

  async execute(): Promise<void> {
    if (this.interactionPayload.hasMultipleActions) {
      this.logger.warn('Interaction payloads with multiple primary actions are not yet supported');
    }
    const actionId = this.interactionPayload.getActionId();
    switch (actionId) {
      case ActionIdentifiers.cancelInteraction: {
        this.logger.info('Handling a cancel interaction action');

        const messagePayload = new MessagePayload(MessageIdentifiers.cancelInteraction, [])
          .shouldDeleteOriginal(true)
          .setNoContent();

        const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
        httpReq.setBody(messagePayload.render());
        await httpReq.post();

        return;
      }

      case ActionIdentifiers.selectQueueType: {
        this.logger.info('Handling submission of a select queue type action');

        const radioButtonActionState = this.interactionPayload
          .getRadioButtonState(BlockIdentifiers.selectQueueAction, BlockIdentifiers.selectQueueMenu);

        if (!radioButtonActionState) {
          this.logger.error({ queueRequestType: radioButtonActionState }, 'Could not identify required state values for queue creation');
          throw new Error('No identifiable queue state or owner');
        }

        const { selected_option: { value: queueName } } = radioButtonActionState;

        const queueData: QueueInsert = {
          name: queueName,
          userId: this.interactionPayload.userId,
          type: 'channel',
          channelId: this.interactionPayload.channelId,
        };
        await this.queueDataMapper.create(queueData);
        const msgPayload = new MessagePayload(`Successfully created the new queue "${queueName}"`, [])
          .shouldReplaceOriginal('true')
          .setResponseType('ephemeral');

        const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
        httpReq.setBody(msgPayload.render());
        await httpReq.post();

        return;
      }

      case ActionIdentifiers.deleteQueue: {
        this.logger.info('Handling submission of a delete queue action');
        
        const action = this.interactionPayload.getActionById(ActionIdentifiers.deleteQueue);
        if (!action || !action?.value) {
          this.logger.error({ action }, 'Action does not have required data values to delete a queue');
          return;
        }

        await this.queueDataMapper.delete(action.value);
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
