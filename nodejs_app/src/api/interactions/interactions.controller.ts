import { randomUUID } from 'crypto';

import { Request } from 'express';
import { inject, injectable } from 'tsyringe';

import { cancelInteraction, deleteQueue, generateNewRequestForm } from './handlers';

import CreateQueueForm from '@Ui/forms/CreateQueueForm';
import { ILogger } from '@Lib/logger';
import { ActionIdentifiers, BlockIdentifiers, SelectionIdentifiers } from '@Common/identifiers';
import { InteractionPayload, MessagePayload } from '@Lib/slack/messagePayloads';
import HttpReq from '@Lib/utils/HttpReq';
import { MarkdownTextObject, TextObject } from '@Lib/slack/blocks/compositionObjects';
import { emojis } from '@Common/emojis';
import {
  ActionBlock, DividerBlock, HeaderBlock, SectionBlock,
} from '@Lib/slack/blocks';
import { Button } from '@Lib/slack/blocks/blockElements';
import Block from '@Lib/slack/blocks/Block';
import { CancelButton } from '@Common/buttons';
import { truncateString } from '@Lib/utils/truncateString';
import { postMessage } from '@Lib/slack/methods';
import { isFailure } from '@Common/exceptionControl';
import { Tokens } from '@Ioc/Tokens';
import { IRepository, RepositoryFactory } from '@Repos/index';
import { TableNames } from '@DB/tableNames';
import {
  QueueModel, QueueTypes, RequestModel, RequestStatus, 
} from '@Models/index';
import { QueueHandler } from '@Api/commands/handlers/QueueHandler';


@injectable()
export default class InteractionsController {
  private readonly interactionPayload: InteractionPayload;

  private readonly queueRepo: IRepository<QueueModel>;

  private readonly requestRepo: IRepository<RequestModel>;

  constructor(
    @inject(Tokens.Get('Logger')) private readonly logger: ILogger,
    @inject(Tokens.Get('RepoFactory')) private readonly repoFactory: RepositoryFactory,
    req: Request, 
  ) {
    this.interactionPayload = new InteractionPayload(JSON.parse(req.body.payload), logger);
    this.queueRepo = this.repoFactory.Create(TableNames.Queues);
    this.requestRepo = this.repoFactory.Create(TableNames.Requests);
  }

  async execute(): Promise<void> {
    if (this.interactionPayload.hasMultipleActions) {
      this.logger.warn('Interaction payloads with multiple primary actions are not yet supported');
    }
    const actionId = this.interactionPayload.getActionId();
    switch (actionId) {
      case ActionIdentifiers.cancel: {
        return await cancelInteraction(this.interactionPayload.responseUrl, this.logger);
      }

      case ActionIdentifiers.submitNewQueue: {
        return await this.handleQueueSubmitted();
      }

      case ActionIdentifiers.deleteQueue: {
        const action = this.interactionPayload.getActionById(ActionIdentifiers.deleteQueue);
        if (!action) {
          this.logger.error('Action content is missing in payload');
          break;
        }
        return await deleteQueue(
          action,
          this.interactionPayload.responseUrl,
          this.interactionPayload.userId,
          this.interactionPayload.channelId!,
          this.queueRepo,
          this.logger,
        );
      }

      case ActionIdentifiers.generateRequestForm: {
        const action = this.interactionPayload.getActionById(ActionIdentifiers.generateRequestForm);
        if (!action) {
          this.logger.error('Action content is missing in payload');
          break;
        }
        return await generateNewRequestForm(action, this.interactionPayload.responseUrl, this.logger);
      }

      case ActionIdentifiers.newRequestSubmitted: {
        return await this.handleSubmitRequest();
      }

      case ActionIdentifiers.viewRequests: {
        return await this.handleListRequests();
      }

      case ActionIdentifiers.acceptRequest: {
        return await this.handleAcceptRequest();
      }

      case ActionIdentifiers.rejectRequest: {
        return await this.handleRejectRequest();
      }

      default: {
        this.logger.warn(
          `Interaction payload with actionId "${actionId}" is not currently supported`,
          { actionId },
        );
      }
    }
  }

  private async handleQueueSubmitted(): Promise<void> {
    this.logger.info('Handling submission of a select queue type action');

    const { defaultQueueValue, customQueueValue } = CreateQueueForm.GetData(this.interactionPayload);

    const queueHandler = new QueueHandler(this.logger, this.repoFactory);
    const defaultQueues = await queueHandler.getDefaultQueues();

    if (!defaultQueueValue && !customQueueValue) {
      this.logger.info('No queue type has been selected', { state: this.interactionPayload.payload, defaultQueueMenuValue: defaultQueueValue, customQueueValue });

      const alert = new MarkdownTextObject(
        `${emojis.exclamation} *You need to select a queue type to proceed*`,
      );
      const queueForm = new CreateQueueForm(defaultQueues, this.logger);
      queueForm.setAlert(alert);
      const renderedQueueForm = queueForm.render();
      if (isFailure(renderedQueueForm)) {
        return;
      }

      const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
      httpReq.setBody(renderedQueueForm.result);
      await httpReq.post();
      return;
    } else if (defaultQueueValue && customQueueValue) {
      this.logger.info('Too many queue types selected', { state: this.interactionPayload.payload, defaultQueueMenuValue: defaultQueueValue, customQueueValue });

      const alert = new MarkdownTextObject(
        `${emojis.exclamation} *You can only select one queue type*`,
      );
      const queueForm = new CreateQueueForm(defaultQueues, this.logger);
      queueForm.setAlert(alert);
      const renderedQueueForm = queueForm.render();
      if (isFailure(renderedQueueForm)) {
        return;
      }

      const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
      httpReq.setBody(renderedQueueForm.result);
      await httpReq.post();
      return;
    }

    const queueName = defaultQueueValue || customQueueValue;
    await this.createQueueForInteractingUser(queueName);

    const msgPayload = new MessagePayload(`Successfully created the new queue "${queueName}"`)
      .shouldReplaceOriginal('true')
      .setResponseType('ephemeral');

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(msgPayload.render());
    await httpReq.post();
  }


  private async handleSubmitRequest(): Promise<void> {
    this.logger.info('Handling submission of a submit queue request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.newRequestSubmitted);
    const inputValue = this.interactionPayload
      .getBlockStateValue(BlockIdentifiers.newRequestInput, SelectionIdentifiers.requestInputField);

    const queue: QueueModel = new QueueModel(JSON.parse(action!.value!));

    const newRequest = new RequestModel(
      randomUUID(),
      queue.id,
      'name',
      inputValue,
      queue.owner!,
      RequestStatus.idle,
    );
    await this.requestRepo.create(newRequest);

    const sectionBlock = new SectionBlock(new TextObject('Successfully submitted your request to queue'));
    const messagePayload = new MessagePayload([sectionBlock]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();

    return;
  }

  private async handleListRequests(): Promise<void> {
    this.logger.info('Handling submission of a create request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.viewRequests);
    const queue = JSON.parse(action!.value!);

    const requests = await this.requestRepo.list({ queueId: queue.id });

    const blocks: Block[] = [];
    requests.forEach((r) => {
      blocks.push(
        new SectionBlock(
          new MarkdownTextObject(`<@${r.createdBy}>: ${r.description}`),
        ),
      );
      const userId = this.interactionPayload.userId;
      const acceptReqBtn = new Button(new TextObject('Pick up request'), 'primary', ActionIdentifiers.acceptRequest)
        .setValue(JSON.stringify({
          requestId: r.id,
          userId,
          requestTitle: r.name,
          requestDescription: r.description,
          requestOwner: r.createdBy,
        }));
      const rejectReqBtn = new Button(new TextObject('Reject'), 'none', ActionIdentifiers.rejectRequest)
        .setValue(JSON.stringify({
          requestId: r.id,
          userId: this.interactionPayload.userId,
          requestOwner: r.createdBy,
        }));
      blocks.push(new ActionBlock([acceptReqBtn, rejectReqBtn]));
      blocks.push(
      );
      blocks.push(new DividerBlock());
    });

    const requestsHeader = new HeaderBlock(new TextObject('Requests'));
    const msgPayload = new MessagePayload([
      requestsHeader,
      ...blocks,
      new ActionBlock([CancelButton]),
    ]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger)
      .setBody(msgPayload.render());
    await httpReq.post();

    return;
  }

  private async handleAcceptRequest(): Promise<void> {
    const action = this.interactionPayload.getActionById(ActionIdentifiers.acceptRequest);
    const {
      requestId, userId, requestTitle, requestDescription, requestOwner,
    } = JSON.parse(action!.value!);
    this.logger.info('Handling an accepted request action', { requestId, userId });
    await this.requestRepo.update(
      requestId,
      { status: RequestStatus.inProgress },
    );
    const msgPayload = new MessagePayload('Request accepted');
    const notificationSection = new SectionBlock(
      new MarkdownTextObject(
        `<@${userId}> has picked up your request "${requestTitle || truncateString(requestDescription, 50)}"`,
      ),
    );
    await postMessage(this.logger, requestOwner, [notificationSection]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger)
      .setBody(msgPayload.render());
    await httpReq.post();
    return;
  }

  private async handleRejectRequest(): Promise<void> {
    const action = this.interactionPayload.getActionById(ActionIdentifiers.rejectRequest);
    const {
      requestId, userId, requestTitle, requestDescription, requestOwner,
    } = JSON.parse(action!.value!);
    this.logger.info('Handling a reject request action', { requestId, userId });
    await this.requestRepo.update(requestId, { status: RequestStatus.rejected });
    const msgPayload = new MessagePayload('Request rejected');
    const notificationSection = new SectionBlock(
      new MarkdownTextObject(
        `<@${userId}> has rejected your request "${requestTitle || truncateString(requestDescription, 50)}"`,
      ),
    );
    await postMessage(this.logger, requestOwner, [notificationSection]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger)
      .setBody(msgPayload.render());
    await httpReq.post();
    return;
  }

  private async createQueueForInteractingUser(name: string): Promise<QueueModel> {
    const queue = new QueueModel({
      id: randomUUID(),
      createdAt: new Date(),
      name,
      owner: this.interactionPayload.userId,
      channel: this.interactionPayload.channelId ?? '',
      type: QueueTypes.channel,
    });
    await this.queueRepo.create(queue);
    return queue;
  }
} 
