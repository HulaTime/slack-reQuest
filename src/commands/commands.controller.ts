import { randomUUID } from 'node:crypto';

import { Logger } from 'pino';

import { MessagePayload } from '../common/types';
import RadioButton from '../common/blocks/elements/RadioButton';
import { MarkdownTextObject, PlainTextObject } from '../common/compositionObjects/TextObject';
import OptionObject from '../common/compositionObjects/OptionObject';
import { ActionBlock } from '../common/blocks';
import QueueDataMapper, { Queue } from '../../datamappers/Queue';
import SlashCommand from '../common/SlashCommand';
import SectionBlock from '../common/blocks/SectionBlock';
import DividerBlock from '../common/blocks/DividerBlock';
import { Button } from '../common/blocks/elements';

import { QueueTypes } from './commands.router';

export default class QueueController {
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
    const header = new SectionBlock(new MarkdownTextObject('*Select queue type*'));
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
