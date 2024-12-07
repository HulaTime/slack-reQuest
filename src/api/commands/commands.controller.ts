import { randomUUID } from 'crypto';

import { inject, injectable } from 'tsyringe';

import establishUser from './utils/establishUser';
import { QueueHandler } from './handlers/QueueHandler';

import { MarkdownTextObject, TextObject } from '@Lib/slack/compositionObjects';
import { RequestCommandActions as RequestCommandActions } from '@Common/identifiers';
import {
  ActionBlock, DividerBlock, HeaderBlock, SectionBlock,
} from '@Lib/slack/blocks';
import { MessagePayload } from '@Lib/slack/messagePayloads';
import { SlackMessagePayload } from '@Lib/slack/messagePayloads/MessagePayload';
import { SlashCommand } from '@Lib/slack/slashCommands';
import { emojis } from '@Common/emojis';
import Block from '@Lib/slack/blocks/Block';
import {
  CancelButton, AddReqButton, DeleteQueueButton, ViewReqButton,
} from '@Common/buttons';
import { isFailure } from '@Common/exceptionControl';
import { Tokens } from '@Ioc/Tokens';
import { ILogger } from '@Lib/logger';
import { TableNames } from '@DB/tableNames';
import { QueueModel, QueueTypes, UserModel } from '@Models/index';
import { IRepository, RepositoryFactory } from '@Repos/index';

 @injectable()
export default class CommandsController {
  private readonly slashCommand: SlashCommand;

  private readonly action: string;

  private readonly queueRepo: IRepository<QueueModel>;

  private readonly userRepo: IRepository<UserModel>;

  constructor(
    @inject(Tokens.Get('Logger')) private readonly logger: ILogger,
    @inject(Tokens.Get('RepoFactory')) private readonly repoFactory: RepositoryFactory,
    slashCommand: SlashCommand,
  ) {
    this.slashCommand = slashCommand;
    this.action = this.slashCommand.action;
    this.queueRepo = repoFactory.Create(TableNames.Queues);
    this.userRepo = repoFactory.Create(TableNames.Users);
  }

  unexpectedActionMessage(action: string): SlackMessagePayload {
    const messagePayload = new MessagePayload(`${action} is not a supported command.`);
    return messagePayload.render();
  }

  async execute(): Promise<SlackMessagePayload> {
    const result = await establishUser(this.slashCommand, this.userRepo, this.logger);
    if (isFailure(result)) {
      throw result.err;
    }


    if (this.action === RequestCommandActions.createQueue) {
      const queueHandler = new QueueHandler(this.logger, this.repoFactory);
      return await queueHandler.handleCreateQueueCommand();
    } else if (this.action === RequestCommandActions.listQueues) {
      return await this.handleListQueuesCommand();
    } else {
      this.logger.warn('Unexpected action type', { action: this.action });
      return this.unexpectedActionMessage(this.action);
    }
  }

  private async handleListQueuesCommand(): Promise<SlackMessagePayload> {
    let [personalQueue] = await this.queueRepo.list(
      { owner: this.slashCommand.userId, type: QueueTypes.user },
    );
    if (!personalQueue) {
      const newPersonalQueue = await this.createUserQueue();
      if (newPersonalQueue) {
        personalQueue = newPersonalQueue;
      }
    }
    const channelQueues = await this.queueRepo.list({ channel: this.slashCommand.channelId });

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

    const messagePayload = new MessagePayload(blocks);
    this.logger.info( 'Successfully created list queues slack message payload', { messagePayload });

    return messagePayload.render();
  }

  private async createUserQueue(): Promise<QueueModel | undefined> {
    try {
      this.logger.debug('Attempting to create a new personal user queue');
      const queue = new QueueModel({
        id: randomUUID(),
        name: 'Personal Queue',
        owner: this.slashCommand.userId,
        createdAt: new Date(),
        channel: this.slashCommand.channelId,
        type: QueueTypes.user,
      });

      await this.queueRepo.create(queue);
      return queue;
    } catch (err) {
      this.logger.error('Failed to create a user queue', { err });
    }
  }
}
