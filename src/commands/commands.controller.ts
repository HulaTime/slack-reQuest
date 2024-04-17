import { Logger } from 'pino';

import QueueDataMapper, { Queue } from '../datamappers/QueueDatamapper';
import { MarkdownTextObject, TextObject } from '../lib/slack/compositionObjects';
import {
  ActionIdentifiers, BlockIdentifiers, MessageIdentifiers, SupportedSlashCommands,
} from '../common/identifiers';
import {
  ActionBlock, DividerBlock, HeaderBlock, SectionBlock,
} from '../lib/slack/blocks';
import { Button } from '../lib/slack/elements';
import { MessagePayload } from '../lib/slack/messagePayloads';
import { SlackMessagePayload } from '../lib/slack/messagePayloads/MessagePayload';
import { SlashCommand } from '../lib/slack/slashCommands';
import { emojis, randomCircleEmoji } from '../common/emojis';
import Block from '../lib/slack/blocks/Block';
import { CreateQueueForm } from '../common/messages';

import { AddReqButton, DeleteQueueButton, ViewReqButton } from './buttons';

export default class CommandsController {
  private readonly logger: Logger;

  private readonly slashCommand: SlashCommand;

  private readonly action: string;

  private readonly queueDataMapper: QueueDataMapper;

  constructor(
    slashCommand: SlashCommand,
    logger: Logger,
  ) {
    this.logger = logger;
    this.slashCommand = slashCommand;
    this.action = this.slashCommand.action;
    this.queueDataMapper = new QueueDataMapper(logger);
  }

  unexpectedActionMessage(action: string): SlackMessagePayload {
    const messagePayload = new MessagePayload(`${action} is not a supported command.`, []);
    return messagePayload.render();
  }

  async execute(): Promise<SlackMessagePayload> {
    if (this.action === SupportedSlashCommands.createQueue) {
      return this.handleCreateQueueCommand();
    } else if (this.action === SupportedSlashCommands.listQueues) {
      return await this.handleListQueuesCommand();
    } else {
      this.logger.warn({ action: this.action }, 'Unexpected action type');
      return this.unexpectedActionMessage(this.action);
    }
  }

  private handleCreateQueueCommand(): SlackMessagePayload {
    return CreateQueueForm();
  }

  private async handleListQueuesCommand(): Promise<SlackMessagePayload> {
    const queues = await this.queueDataMapper.list({ userId: this.slashCommand.userId });
    const existingPersonalQueue = queues.find(q => q.type === 'user');

    if (!existingPersonalQueue) {
      const personalQueue = await this.createUserQueue();
      if (personalQueue) {
        queues.unshift(personalQueue);
      }
    }

    const headerBlock = new HeaderBlock('header-block-id', new TextObject('Available Queues'));
    const blocks: Block[] = [
      headerBlock,
    ];
    queues.forEach(queue => {
      const prefix = queue.type === 'user' ? emojis.crown : randomCircleEmoji();
      const queueSection = new SectionBlock(
        `${BlockIdentifiers.listedQueueSection}:${queue.id}`,
        new MarkdownTextObject(`${prefix} ${queue.name}`),
      );
      const actionBlock = new ActionBlock(
        `${ActionIdentifiers.viewQueueAction}:${queue.id}`,
        [ViewReqButton(queue.id), AddReqButton(queue.id), DeleteQueueButton(queue.id)],
      );

      blocks.push(new DividerBlock());
      blocks.push(queueSection);
      blocks.push(actionBlock);
    });

    blocks.push(new ActionBlock('action-close-block-id', [new Button(ActionIdentifiers.cancelInteraction, new TextObject('Close'), 'danger')]));

    const messagePayload = new MessagePayload(MessageIdentifiers.listQueuesResponse, blocks);
    this.logger.info({ messagePayload }, 'Successfully created list queues slack message payload');

    return messagePayload.render();
  }

  private async createUserQueue(): Promise<Queue | undefined> {
    try {
      this.logger.debug('Attempting to create a new personal user queue');

      return await this.queueDataMapper.create({
        name: 'My Personal Queue',
        userId: this.slashCommand.userId,
        type: 'user',
      });
    } catch (err) {
      this.logger.error({ err }, 'Failed to create a user queue');
    }
  }
}
