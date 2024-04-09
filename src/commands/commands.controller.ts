import { Logger } from 'pino';

import QueueDataMapper from '../datamappers/QueueDatamapper';
import { MarkdownTextObject, OptionObject, TextObject } from '../lib/slack/compositionObjects';
import {
  ActionIdentifiers, BlockIdentifiers, DefaultQueueTypes, MessageIdentifiers, 
} from '../common/identifiers';
import {
  ActionBlock, DividerBlock, HeaderBlock, SectionBlock,
} from '../lib/slack/blocks';
import { Button, RadioButton } from '../lib/slack/elements';
import { MessagePayload } from '../lib/slack/messagePayloads';
import { SlackMessagePayload } from '../lib/slack/messagePayloads/MessagePayload';
import { SlashCommand } from '../lib/slack/slashCommands';

enum SupportedCommands {
  create = 'create',
  list = 'list',
  view = 'view',
}

export default class CommandsController {
  private readonly action: string;

  constructor(
    private readonly slashCommand: SlashCommand,
    private readonly logger: Logger,
  ) {
    this.action = this.slashCommand.action;
  }

  unexpectedActionMessage(action: string): SlackMessagePayload {
    const messagePayload = new MessagePayload(`${action} is not a supported command.`, []);
    return messagePayload.render();
  }

  async execute(): Promise<SlackMessagePayload> {
    if (this.action === SupportedCommands.create) {
      const headerBlock = new HeaderBlock(new TextObject('Create a new Queue!'));
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
        new MarkdownTextObject('*What type of requests should be managed by this queue?*'),
        BlockIdentifiers.selectQueueSection, 
      );

      const createButton = new Button(new TextObject('Create'), 'primary', ActionIdentifiers.selectQueueType);
      const cancelButton = new Button(new TextObject('Cancel'), 'danger', ActionIdentifiers.cancelInteraction);

      const actionBlock = new ActionBlock(BlockIdentifiers.selectQueueAction, [
        radioButtons,
        createButton,
        cancelButton,
      ]);

      const messageBlocks = [
        headerBlock,
        sectionBlock,
        actionBlock,
      ];

      const msgPayload = new MessagePayload(MessageIdentifiers.selectQueueRequestType, messageBlocks)
        .setResponseType('ephemeral')
        .shouldReplaceOriginal('true');

      return msgPayload.render();
    } else if (this.action === SupportedCommands.list) {
      const queueDataMapper = new QueueDataMapper(this.logger);
      const queues = await queueDataMapper.list({ userId: this.slashCommand.userId });

      const headerBlock = new HeaderBlock(new TextObject('My Queues'));
      const blocks = [
        headerBlock,
        new DividerBlock(),
      ];
      queues.forEach(queue => {
        blocks.push(new SectionBlock(
          new TextObject(queue.name),
          'temp',
        ));
      });

      const messagePayload = new MessagePayload(MessageIdentifiers.listQueuesResponse, blocks);
      this.logger.info({ messagePayload }, 'Successfully created list queues slack message payload');

      return messagePayload.render();
    } else if (this.action === SupportedCommands.view) {
      const myQueueButton = new Button(new TextObject('My Queue'), 'none', 'view-my-queue');
      const channelQueueButton = new Button(new TextObject('Channel Queue'), 'none', 'view-channel-queue');
      const cancelButton = new Button(new TextObject('Cancel'), 'danger', ActionIdentifiers.cancelInteraction);

      const headerBlock = new HeaderBlock(new TextObject('View Requests in a queue'));
      const sectionBlock = new SectionBlock(
        new MarkdownTextObject('*Which queue would you like to check?*'),
        'temp2',
      )
        .addAccessory(myQueueButton)
        .addAccessory(channelQueueButton)
        .addAccessory(cancelButton);

      const messagePayload = new MessagePayload(
        MessageIdentifiers.selectQueueToView,
        [headerBlock, sectionBlock],
      );

      return messagePayload.render();
    } else {
      this.logger.warn({ action: this.action }, 'Unexpected action type');
      return this.unexpectedActionMessage(this.action);
    }
  }
}
