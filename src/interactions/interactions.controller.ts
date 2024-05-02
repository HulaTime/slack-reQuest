import { Request } from 'express';
import { Logger } from 'pino';

import { ActionIdentifiers, BlockIdentifiers, MessageIdentifiers } from '../common/identifiers';
import QueueDataMapper, { Queue, QueueInsert } from '../datamappers/QueueDatamapper';
import { InteractionPayload, MessagePayload } from '../lib/slack/messagePayloads';
import HttpReq from '../lib/utils/HttpReq';
import { MarkdownTextObject, TextObject } from '../lib/slack/compositionObjects';
import { emojis } from '../common/emojis';
import { CreateQueueForm } from '../common/messages';
import {
  ActionBlock, DividerBlock, HeaderBlock, InputBlock, SectionBlock,
} from '../lib/slack/blocks';
import { Button, PlainTextInput } from '../lib/slack/elements';
import RequestDataMapper from '../datamappers/RequestDatamapper';
import { AddReqButton, DeleteQueueButton, ViewReqButton } from '../commands/buttons';
import Block from '../lib/slack/blocks/Block';
import { MAX_QUEUE_REQUEST_LENGTH } from '../../constants/app';

export default class InteractionsController {
  private readonly interactionPayload: InteractionPayload;

  private readonly logger: Logger;

  private readonly queueDataMapper: QueueDataMapper;

  private readonly requestDataMapper: RequestDataMapper;

  constructor(req: Request, logger: Logger) {
    this.interactionPayload = new InteractionPayload(JSON.parse(req.body.payload), logger);
    this.logger = logger;
    this.queueDataMapper = new QueueDataMapper(logger);
    this.requestDataMapper = new RequestDataMapper(logger);
  }

  async execute(): Promise<void> {
    if (this.interactionPayload.hasMultipleActions) {
      this.logger.warn('Interaction payloads with multiple primary actions are not yet supported');
    }
    const actionId = this.interactionPayload.getActionId();
    switch (actionId) {
      case ActionIdentifiers.cancelInteraction: {
        return await this.handleCancelInteraction();
      }

      case ActionIdentifiers.queueTypeSelected: {
        return await this.handleQueueTypeSelected();
      }

      case ActionIdentifiers.deleteQueue: {
        return await this.handleDeleteQueueInteraction();
      }

      case ActionIdentifiers.addQueueRequest: {
        return await this.handleAddQueueRequest();
      }

      case ActionIdentifiers.submitQueueRequest: {
        return await this.handleSubmitQueueRequest();
      }

      case ActionIdentifiers.listRequests: {
        return await this.handleListRequests();
      }

      default: {
        this.logger.warn(
          { actionId },
          `Interaction payload with actionId "${actionId}" is not currently supported`,
        );
      }
    }
  }

  private async handleCancelInteraction(): Promise<void> {
    this.logger.info('Handling a cancel interaction action');

    const messagePayload = new MessagePayload(MessageIdentifiers.cancelInteraction, [])
      .shouldDeleteOriginal(true)
      .setNoContent();

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();
  }

  private async handleQueueTypeSelected(): Promise<void> {
    this.logger.info('Handling submission of a select queue type action');

    const defaultQueueMenuValue = this.interactionPayload
      .getBlockActionValue(BlockIdentifiers.defaultQueueInput, ActionIdentifiers.defaultQueueSelected);
    const customQueueInputValue = this.interactionPayload
      .getBlockActionValue(BlockIdentifiers.customQueueInput, ActionIdentifiers.customInputSelected);

    if (!defaultQueueMenuValue && !customQueueInputValue) {
      this.logger.info({ state: this.interactionPayload.payload, defaultQueueMenuValue, customQueueInputValue }, 'No queue type has been selected');
      const alert = new MarkdownTextObject(
        `${emojis.exclamation} *You need to select a queue type to proceed*`,
      );
      const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
      httpReq.setBody(CreateQueueForm(alert));
      await httpReq.post();
      return;
    } else if (defaultQueueMenuValue && customQueueInputValue) {
      this.logger.info({ state: this.interactionPayload.payload, defaultQueueMenuValue, customQueueInputValue }, 'Too many queue types selected');
      const alert = new MarkdownTextObject(
        `${emojis.exclamation} *You can only select one queue type*`,
      );
      const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
      httpReq.setBody(CreateQueueForm(alert));
      await httpReq.post();
      return;
    }

    const queueName = defaultQueueMenuValue || customQueueInputValue;
    await this.createQueueForInteractingUser(queueName);

    const msgPayload = new MessagePayload(`Successfully created the new queue "${queueName}"`, [])
      .shouldReplaceOriginal('true')
      .setResponseType('ephemeral');

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(msgPayload.render());
    await httpReq.post();
  }

  private async handleDeleteQueueInteraction(): Promise<void> {
    this.logger.info('Handling submission of a delete queue action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.deleteQueue);

    if (!action || !action?.value) {
      this.logger.error({ action }, 'Action does not have required data values to delete a queue');
      return;
    }

    await this.queueDataMapper.delete(JSON.parse(action.value).id);

    const [personalQueue] = await this.queueDataMapper.list({ userId: this.interactionPayload.userId, type: 'user' });

    const channelQueues = await this.queueDataMapper.list({ channelId: this.interactionPayload.channelId });

    const headerBlock = new HeaderBlock('header-block-id', new TextObject('Available Queues'));
    const personalQueueSection = new SectionBlock(
      `${BlockIdentifiers.listedQueueSection}:${personalQueue.id}`,
      new MarkdownTextObject(`${emojis.crown} *${personalQueue.name}*`),
    );
    const personalQueueActionBlock = new ActionBlock(
      `${ActionIdentifiers.queueButtons}:${personalQueue.id}`,
      [ViewReqButton(JSON.stringify(personalQueue))]);
    const blocks: Block[] = [
      headerBlock,
      personalQueueSection,
      personalQueueActionBlock,
      new DividerBlock(),
    ];
    channelQueues.forEach(queue => {
      const queueSection = new SectionBlock(
        `${BlockIdentifiers.listedQueueSection}:${queue.id}`,
        new MarkdownTextObject(`${emojis.squares.black.medium} *${queue.name}*`),
      );

      const stringifiedQueue = JSON.stringify(queue);
      const queueButtons = [
        ViewReqButton(stringifiedQueue), AddReqButton(stringifiedQueue), DeleteQueueButton(stringifiedQueue),
      ];
      const queueActionBlock = new ActionBlock(`${ActionIdentifiers.queueButtons}:${queue.id}`, queueButtons);

      blocks.push(queueSection);
      blocks.push(queueActionBlock);
    });

    blocks.push(new ActionBlock('action-close-block-id', [new Button(ActionIdentifiers.cancelInteraction, new TextObject('Close'), 'danger')]));

    const messagePayload = new MessagePayload(MessageIdentifiers.listQueuesResponse, blocks);
    this.logger.info({ messagePayload }, 'Successfully created updated list queues slack message payload');

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();
  }

  private async handleAddQueueRequest(): Promise<void> {
    this.logger.info('Handling submission of a create request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.addQueueRequest);

    const inputElement = new PlainTextInput(ActionIdentifiers.newRequestEntered, MAX_QUEUE_REQUEST_LENGTH);
    inputElement.multiline = true;
    const inputBlock = new InputBlock(BlockIdentifiers.newRequestInput, new TextObject('What is your request?'), inputElement);

    const submitButton = new Button(ActionIdentifiers.submitQueueRequest, new TextObject('Submit'), 'primary');
    submitButton.setValue(action!.value!);
    const cancelButton = new Button(ActionIdentifiers.cancelInteraction, new TextObject('Cancel'), 'danger');

    const actionBlock = new ActionBlock(BlockIdentifiers.newRequestButtons, [submitButton, cancelButton]);

    const messagePayload = new MessagePayload(MessageIdentifiers.newRequestForm, [inputBlock, actionBlock]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();

    return;
  }

  private async handleSubmitQueueRequest(): Promise<void> {
    this.logger.info('Handling submission of a submit queue request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.submitQueueRequest);
    const inputValue = this.interactionPayload
      .getBlockActionValue(BlockIdentifiers.newRequestInput, ActionIdentifiers.newRequestEntered);

    const queue: Queue = JSON.parse(action!.value!);

    await this.requestDataMapper.create({
      description: inputValue,
      queueId: queue.id,
      type: queue.type,
      userId: queue.userId,
      channelId: queue.channelId,
      createdById: this.interactionPayload.userId,
      createdByName: this.interactionPayload.userName,
    });

    const sectionBlock = new SectionBlock('sdfas', new TextObject('Successfully submitted your request to queue'));
    const messagePayload = new MessagePayload('submit-request-message', [sectionBlock]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();

    return;
  }

  private async handleListRequests(): Promise<void> {
    this.logger.info('Handling submission of a create request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.listRequests);
    const queue = JSON.parse(action!.value!);

    const requests = await this.requestDataMapper.list({ queueId: queue.id });

    const blocks: Block[] = [];
    requests.forEach((r) => {
      blocks.push(
        new SectionBlock(
          `${r.id}`,
          new MarkdownTextObject(`<@${r.createdById}>: ${r.description}`),
        )
          .addAccessory(new Button(r.id, new TextObject('Expand'), 'none')),
      );
    });

    const requestsHeader = new HeaderBlock('list-requests-header-block', new TextObject('Requests'));
    const msgPayload = new MessagePayload('sfd', [
      requestsHeader,
      ...blocks,
      new DividerBlock(),
    ]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger)
      .setBody(msgPayload.render());
    await httpReq.post();

    return;
  }

  private async createQueueForInteractingUser(name: string): Promise<Queue> {
    const queueData: QueueInsert = {
      name,
      userId: this.interactionPayload.userId,
      type: 'channel',
      channelId: this.interactionPayload.channelId,
    };
    return await this.queueDataMapper.create(queueData);
  }

} 
