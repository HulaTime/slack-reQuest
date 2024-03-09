import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import HeaderBlock from '../common/blocks/HeaderBlock';
import RadioButton from '../common/blocks/elements/RadioButton';
import OptionObject from '../common/compositionObjects/OptionObject';
import SlashCommand from '../common/SlashCommand';
import DividerBlock from '../common/blocks/DividerBlock';
import QueueDataMapper, { Queue } from '../datamappers/QueueDatamapper';
import { Button } from '../common/blocks/elements';
import { ActionBlock } from '../common/blocks';
import { MessagePayload } from '../common/types';
import { PlainTextObject } from '../common/compositionObjects/TextObject';

import { QueueTypes } from './commands.router';

export default class CommandsController {
  private readonly action: string;

  constructor(
    private readonly slashCommand: SlashCommand,
    private readonly logger: Logger,
    private readonly datamapper: QueueDataMapper,
  ) {
    this.action = this.slashCommand.action;
  }

  buildSelectQueueTypeMessage(): MessagePayload {
    const radioButtons = new RadioButton('select-queue-type');
    (Object.keys(QueueTypes) as Array<keyof typeof QueueTypes>).forEach(queueType => {
      const queueText = new PlainTextObject(QueueTypes[queueType]);
      radioButtons.addOption(new OptionObject(queueText, queueText.text));
    });
    const header = new HeaderBlock(new PlainTextObject('Select queue type'));
    const actionsBlock = new ActionBlock([
      radioButtons,
      new Button(
        new PlainTextObject('Submit'),
        'submit-queue-type',
      ),
    ]);
    this.logger.info({ actionsBlock: actionsBlock.render() });
    return { 
      text: 'Some text',
      blocks: [
        header.render(),
        new DividerBlock().render(),
        actionsBlock.render(),
      ],
    };
  }

  async createQueue(name: string, userId: string): Promise<Queue> {
    const result = await this.datamapper.create({
      id: randomUUID(),
      name,
      userId,
    });
    this.logger.info({ result }, `Successfully created a new queue "${name}"`);
    return result;
  }

  execute(): MessagePayload | undefined {
    if (this.action === 'create') {
      return this.buildSelectQueueTypeMessage();
    } else {
      this.logger.warn({ action: this.action }, 'Unexpected action type');
    }
  }
}
