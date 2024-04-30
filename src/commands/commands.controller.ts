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
import { emojis } from '../common/emojis';
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
    let [personalQueue] = await this.queueDataMapper.list({ userId: this.slashCommand.userId, type: 'user' });
    if (!personalQueue) {
      const newPersonalQueue = await this.createUserQueue();
      if (newPersonalQueue) {
        personalQueue = newPersonalQueue;
      }
    }
    const channelQueues = await this.queueDataMapper.list({ channelId: this.slashCommand.channelId });

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
