import { Request } from 'express';
import { Logger } from 'pino';

import InteractionPayload, { RadioButtonActionState } from '../lib/slack/messages/InteractionPayload';
import { ActionIdentifiers, MessageIdentifiers } from '../common/identifiers';
import QueueDataMapper, { QueueInsert } from '../datamappers/QueueDatamapper';
import MessagePayload, { SlackMessagePayload } from '../lib/slack/messages/MessagePayload';
import ResponseMessage from '../lib/slack/messages/ResponseMessage';
import { ActionBlock, SectionBlock } from '../lib/slack/blocks';
import { MarkdownTextObject, OptionObject, TextObject } from '../lib/slack/compositionObjects';
import { Button, RadioButton } from '../lib/slack/elements';
import CancelInteractionResponseMessage from '../lib/slack/messages/CancelInteractionResponseMessage';

export enum QueueTypes {
  codeReview = 'code-review',
  release = 'release'
};

export default class InteractionsController {
  private readonly interactionPayload: InteractionPayload;

  private readonly logger: Logger;

  constructor(req: Request, logger: Logger) {
    this.interactionPayload = new InteractionPayload(JSON.parse(req.body.payload));
    console.log('---------- this.interactionPayload ----------', JSON.stringify(this.interactionPayload, null, 2));
    this.logger = logger;
  }


  createResponseMsg(): ResponseMessage {
    const radioButtons = new RadioButton(ActionIdentifiers.selectQueueRequestType);
    radioButtons.addOption(new OptionObject(
      new TextObject('Code Review'),
      QueueTypes.codeReview,
    ));
    radioButtons.addOption(new OptionObject(
      new TextObject('Release'),
      QueueTypes.release,
    ));
    const selectQueueTypeSection = new SectionBlock(
      new MarkdownTextObject('*What type of requests should be managed by this queue?*'),
    );
    selectQueueTypeSection.addAccessory(radioButtons);

    const nextButton = new Button(new TextObject('Next'), ActionIdentifiers.proceedFromRequestType);
    const cancelButton = new Button(new TextObject('Cancel'), ActionIdentifiers.cancelInteraction);
    nextButton.setStyle('primary');
    cancelButton.setStyle('danger');

    const buttonActions = new ActionBlock([
      nextButton,
      cancelButton,
    ]);

    const messageBlocks = [
      selectQueueTypeSection,
      buttonActions,
    ];

    return new ResponseMessage(MessageIdentifiers.selectQueueRequestType, messageBlocks);
  }


  async execute(): Promise<SlackMessagePayload | void> {
    if (this.interactionPayload.hasMultipleActions) {
      this.logger.warn('Interaction payloads with multiple primary actions are not yet supported');
    }
    const actionId = this.interactionPayload.getActionId();
    switch (actionId) {
      case ActionIdentifiers.cancelInteraction: {
        const messagePayload = new CancelInteractionResponseMessage();
        const result = await fetch(this.interactionPayload.responseUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(messagePayload.render()),
        });
        const parsedResult = await result.json();
        this.logger.info({ parsedResult, actionId }, 'Successfully sent a cancelled response message to the interactive message');

        return;
      }
      case ActionIdentifiers.proceedFromOwnershipType: {
        const responseMsg = this.createResponseMsg();
        responseMsg
          .setResponseType('ephemeral')
          .shouldReplaceOriginal(true);
        const result = await fetch(this.interactionPayload.responseUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(responseMsg.render()),
        });
        const parsedResult = await result.json();
        this.logger.info({ parsedResult, actionId }, 'Successfully sent a response message to the interactive message');

        return;
      }
      case 'void': {
        this.logger.info('Handling submission of a queue type');
        const selectQueueTypeState = this.interactionPayload
          .getActionState(ActionIdentifiers.selectQueueOwnershipType) as RadioButtonActionState;
        const selectQueueOwnerState = this.interactionPayload
          .getActionState(ActionIdentifiers.selectQueueRequestType) as RadioButtonActionState;

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
