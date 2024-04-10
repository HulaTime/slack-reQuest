import { Logger } from 'pino';

import QueueDataMapper, { Queue } from '../datamappers/QueueDatamapper';
import { MarkdownTextObject, OptionObject, TextObject } from '../lib/slack/compositionObjects';
import {
  ActionIdentifiers, BlockIdentifiers, DefaultQueueTypes, MessageIdentifiers, SupportedSlashCommands,
} from '../common/identifiers';
import {
  ActionBlock, DividerBlock, HeaderBlock, SectionBlock,
} from '../lib/slack/blocks';
import { Button, RadioButton } from '../lib/slack/elements';
import { MessagePayload } from '../lib/slack/messagePayloads';
import { SlackMessagePayload } from '../lib/slack/messagePayloads/MessagePayload';
import { SlashCommand } from '../lib/slack/slashCommands';
import { emojis, randomCircleEmoji } from '../common/emojis';
import Block from '../lib/slack/blocks/Block';

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
      const radioButtons = new RadioButton(BlockIdentifiers.selectQueueMenu)
        .addOption(new OptionObject(
          new TextObject('Code Review'),
          DefaultQueueTypes.codeReview,
        ))
        .addOption(new OptionObject(
          new TextObject('Release'),
          DefaultQueueTypes.release,
        ));

      const sectionBlock = new SectionBlock(
        BlockIdentifiers.selectQueueSection,
        new MarkdownTextObject('*What type of requests should be managed by this queue?*'),
      );

      const createButton = new Button(new TextObject('Create'), 'primary', ActionIdentifiers.selectQueueType);
      const cancelButton = new Button(new TextObject('Cancel'), 'danger', ActionIdentifiers.cancelInteraction);

      const actionBlock = new ActionBlock(BlockIdentifiers.selectQueueAction, [
        radioButtons,
        createButton,
        cancelButton,
      ]);

      const messageBlocks = [
        sectionBlock,
        actionBlock,
      ];

      const msgPayload = new MessagePayload(MessageIdentifiers.selectQueueRequestType, messageBlocks)
        .setResponseType('ephemeral')
        .shouldReplaceOriginal('true');

      return msgPayload.render();
    } else if (this.action === SupportedSlashCommands.listQueues) {
      const queues = await this.queueDataMapper.list({ userId: this.slashCommand.userId });
      const existingPersonalQueue = queues.find(q => q.type === 'user');

      if (!existingPersonalQueue) {
        const personalQueue = await this.createUserQueue();
        if (personalQueue) {
          queues.unshift(personalQueue);
        }
      }

      const headerBlock = new HeaderBlock(new TextObject('Available Queues'));
      const blocks: Block[] = [
        headerBlock,
      ];
      queues.forEach(queue => {
        const prefix = queue.type === 'user' ? emojis.crown : randomCircleEmoji();
        const queueSection = new SectionBlock(
          `${BlockIdentifiers.listedQueueSection}:${queue.id}`,
          new MarkdownTextObject(`${prefix} ${queue.name}`),
        );
        
        const viewReqButton = new Button(new TextObject('View requests'), 'primary', ActionIdentifiers.viewQueueRequests)
          .setValue(queue.id);
        const addReqButton = new Button(new TextObject('Add request'), 'primary', ActionIdentifiers.addQueueRequest)
          .setValue(queue.id);
        const deleteQueueButton = new Button(new TextObject('Delete!'), 'danger', ActionIdentifiers.deleteQueue)
          .setValue(queue.id);
        const actionBlock = new ActionBlock(
          `${ActionIdentifiers.viewQueueAction}:${queue.id}`, 
          [viewReqButton, addReqButton, deleteQueueButton],
        );

        blocks.push(new DividerBlock());
        blocks.push(queueSection);
        blocks.push(actionBlock);
      });

      blocks.push(new ActionBlock(ActionIdentifiers.cancelInteraction, [new Button(new TextObject('Close'), 'danger', ActionIdentifiers.cancelInteraction)]));

      const messagePayload = new MessagePayload(MessageIdentifiers.listQueuesResponse, blocks);
      this.logger.info({ messagePayload }, 'Successfully created list queues slack message payload');

      return messagePayload.render();
    } else {
      this.logger.warn({ action: this.action }, 'Unexpected action type');
      return this.unexpectedActionMessage(this.action);
    }
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
