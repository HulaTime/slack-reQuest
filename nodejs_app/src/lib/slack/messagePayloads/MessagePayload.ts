import Block from '../blocks/Block';

export interface IMessagePayload {
  text?: string;
  blocks?: Block[];
  thread_ts?: string;
  mrkdwn?: boolean;
  replace_original?: 'true' | 'false';
  response_type?: 'in_channel' | 'ephemeral';
  delete_original?: boolean;
}

export type SlackMessagePayload = {
  blocks?: Record<string, unknown>[];
  text?: string;
} & Omit<IMessagePayload, 'blocks' | 'text'>;

export default class MessagePayload implements IMessagePayload {
  noContent: boolean = false;

  text?: string;

  blocks?: Block[];

  replace_original?: 'true' | 'false';

  response_type?: 'in_channel' | 'ephemeral';

  delete_original?: boolean;

  constructor(msgOrBlocks?: string | Block[]) {
    if (typeof msgOrBlocks === 'string') {
      this.text = msgOrBlocks;
    } else {
      this.blocks = msgOrBlocks;
    }
  }

  shouldReplaceOriginal(option: 'true' | 'false'): this {
    this.replace_original = option;
    return this;
  }

  shouldDeleteOriginal(option: boolean): this {
    this.delete_original = option;
    return this;
  }

  setResponseType(type: 'in_channel' | 'ephemeral'): this {
    this.response_type = type;
    return this;
  }

  render(): SlackMessagePayload {
    return {
      text: this.text,
      blocks: this.blocks ? this.blocks.map(block => block.render()) : undefined,
      delete_original: this.delete_original,
      replace_original: this.replace_original,
    };
  }
}
