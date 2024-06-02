import { Request } from 'express';
import { Logger } from 'pino';

import QueueDataMapper, { Queue, QueueInsert } from '@Datamappers/QueueDatamapper';
import RequestDataMapper from '@Datamappers/RequestDatamapper';
import {
  ActionIdentifiers, BlockIdentifiers, MessageIdentifiers, SelectionIdentifiers, 
} from '@Common/identifiers';
import { InteractionPayload, MessagePayload } from '@Lib/slack/messagePayloads';
import HttpReq from '@Lib/utils/HttpReq';
import { MarkdownTextObject, TextObject } from '@Lib/slack/compositionObjects';
import { emojis } from '@Common/emojis';
import { CreateQueueForm } from '@Common/messages';
import {
  ActionBlock, DividerBlock, HeaderBlock, InputBlock, SectionBlock,
} from '@Lib/slack/blocks';
import { Button, PlainTextInput } from '@Lib/slack/elements';
import Block from '@Lib/slack/blocks/Block';
import { MAX_QUEUE_REQUEST_LENGTH } from '@Constants/app';
import {
  AddReqButton, CancelButton, DeleteQueueButton, ViewReqButton,
} from '@Common/buttons';

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
      case ActionIdentifiers.cancel: {
        return await this.handleCancelInteraction();
      }

      case ActionIdentifiers.submitNewQueue: {
        return await this.handleQueueSubmitted();
      }

      case ActionIdentifiers.deleteQueue: {
        return await this.handleDeleteQueue();
      }

      case ActionIdentifiers.addRequest: {
        return await this.handleAddRequest();
      }

      case ActionIdentifiers.submitRequest: {
        return await this.handleSubmitRequest();
      }

      case ActionIdentifiers.viewRequests: {
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

  private async handleQueueSubmitted(): Promise<void> {
    this.logger.info('Handling submission of a select queue type action');

    const defaultQueueMenuValue = this.interactionPayload
      .getBlockStateValue(BlockIdentifiers.defaultQueueInput, SelectionIdentifiers.defaultQueueRadioOption);
    const customQueueInputValue = this.interactionPayload
      .getBlockStateValue(BlockIdentifiers.customQueueInput, SelectionIdentifiers.customQueueInput);

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

  private async handleDeleteQueue(): Promise<void> {
    this.logger.info('Handling submission of a delete queue action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.deleteQueue);

    if (!action || !action?.value) {
      this.logger.error({ action }, 'Action does not have required data values to delete a queue');
      return;
    }

    await this.queueDataMapper.delete(JSON.parse(action.value).id);

    const [personalQueue] = await this.queueDataMapper.list({ userId: this.interactionPayload.userId, type: 'user' });

    const channelQueues = await this.queueDataMapper.list({ channelId: this.interactionPayload.channelId });

    const headerBlock = new HeaderBlock(new TextObject('Available Queues'));
    const personalQueueSection = new SectionBlock(
      new MarkdownTextObject(`${emojis.crown} *${personalQueue.name}*`),
    );
    const personalQueueActionBlock = new ActionBlock(
      [ViewReqButton(JSON.stringify(personalQueue))],
    );
    const blocks: Block[] = [
      headerBlock,
      personalQueueSection,
      personalQueueActionBlock,
      new DividerBlock(),
    ];
    channelQueues.forEach(queue => {
      const queueSection = new SectionBlock(
        new MarkdownTextObject(`${emojis.squares.black.medium} *${queue.name}*`),
      );

      const stringifiedQueue = JSON.stringify(queue);
      const queueButtons = [
        ViewReqButton(stringifiedQueue), AddReqButton(stringifiedQueue), DeleteQueueButton(stringifiedQueue),
      ];
      const queueActionBlock = new ActionBlock(queueButtons);

      blocks.push(queueSection);
      blocks.push(queueActionBlock);
    });

    blocks.push(new ActionBlock([CancelButton]));

    const messagePayload = new MessagePayload(MessageIdentifiers.listQueuesResponse, blocks);
    this.logger.info({ messagePayload }, 'Successfully created updated list queues slack message payload');

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();
  }

  private async handleAddRequest(): Promise<void> {
    this.logger.info('Handling submission of a create request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.addRequest);

    const inputElement = new PlainTextInput(SelectionIdentifiers.requestInputField);
    inputElement.setMaxLength(MAX_QUEUE_REQUEST_LENGTH);
    inputElement.multiline = true;
    const inputBlock = new InputBlock(inputElement, new TextObject('What is your request?'), BlockIdentifiers.newRequestInput);

    const submitButton = new Button(new TextObject('Submit'), 'primary', ActionIdentifiers.submitRequest);
    submitButton.setValue(action!.value!);

    const actionBlock = new ActionBlock([submitButton, CancelButton], BlockIdentifiers.newRequestButtons);

    const messagePayload = new MessagePayload(MessageIdentifiers.newRequestForm, [inputBlock, actionBlock]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();

    return;
  }

  private async handleSubmitRequest(): Promise<void> {
    this.logger.info('Handling submission of a submit queue request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.submitRequest);
    const inputValue = this.interactionPayload
      .getBlockStateValue(BlockIdentifiers.newRequestInput, SelectionIdentifiers.requestInputField);

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

    const sectionBlock = new SectionBlock(new TextObject('Successfully submitted your request to queue'));
    const messagePayload = new MessagePayload('submit-request-message', [sectionBlock]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();

    return;
  }

  private async handleListRequests(): Promise<void> {
    this.logger.info('Handling submission of a create request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.viewRequests);
    const queue = JSON.parse(action!.value!);

    const requests = await this.requestDataMapper.list({ queueId: queue.id });

    const blocks: Block[] = [];
    requests.forEach((r) => {
      blocks.push(
        new SectionBlock(
          new MarkdownTextObject(`<@${r.createdById}>: ${r.description}`),
        ),
      );
      blocks.push(new ActionBlock([
        new Button(new TextObject('Pick up request'), 'primary'),
        new Button(new TextObject('Reject'), 'none'),
      ]));
      blocks.push(
      );
      blocks.push(new DividerBlock());
    });

    const requestsHeader = new HeaderBlock(new TextObject('Requests'));
    const msgPayload = new MessagePayload('sfd', [
      requestsHeader,
      ...blocks,
      new ActionBlock([CancelButton]),
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
