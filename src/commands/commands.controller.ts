import { Logger } from 'pino';

import {
  ActionBlock, DividerBlock, HeaderBlock, SectionBlock, 
} from '../lib/slack/blocks';
import { OptionObject, TextObject } from '../lib/slack/compositionObjects';
import { Button, RadioButton } from '../lib/slack/elements';
import QueueDataMapper from '../datamappers/QueueDatamapper';
import MessagePayload, { SlackMessagePayload } from '../lib/slack/messages/MessagePayload';
import { SlashCommand } from '../lib/slack/messages';

import { QueueTypes } from './commands.router';

export default class CommandsController {
  private readonly action: string;

  constructor(
    private readonly slashCommand: SlashCommand,
    private readonly logger: Logger,
  ) {
    this.action = this.slashCommand.action;
  }

  selectQueueTypeMessage(): SlackMessagePayload {
    const header = new HeaderBlock(new TextObject('Select queue type'));
    const submitButton = new Button(new TextObject('Submit'), 'submit-queue-type');
    const selectQueueRadioMenu = new RadioButton('select-queue-type');
    (Object.keys(QueueTypes) as Array<keyof typeof QueueTypes>).forEach(queueType => {
      const queueText = new TextObject(QueueTypes[queueType]);
      selectQueueRadioMenu.addOption(new OptionObject(queueText, queueText.text));
    });
    const actionsBlock = new ActionBlock([
      selectQueueRadioMenu,
      submitButton,
    ]);
    const blocks = [
      header,
      new DividerBlock(),
      actionsBlock,
    ];
    const messagePayload = new MessagePayload('select-queue-message', blocks);
    this.logger.info({ messagePayload }, 'Successfully created select queue type slack message payload');
    return messagePayload.render(); 
  }

  async buildListQueuesMessage(): Promise<SlackMessagePayload> {
    const queueDataMapper = new QueueDataMapper(this.logger);
    const queues = await queueDataMapper.list({ userId: this.slashCommand.userId });
    const header = new HeaderBlock(new TextObject('My Queues'));
    const blocks = [
      header.render(),
      new DividerBlock().render(),
    ];
    queues.forEach(queue => {
      blocks.push(new SectionBlock(new TextObject(queue.name)).render());
    });
    return { text: '', blocks };
  }

  async execute(): Promise<SlackMessagePayload | undefined> {
    if (this.action === 'create') {
      return this.selectQueueTypeMessage();
    } else if (this.action === 'list') {
      return await this.buildListQueuesMessage();
    } else {
      this.logger.warn({ action: this.action }, 'Unexpected action type');
    }
  }
}
