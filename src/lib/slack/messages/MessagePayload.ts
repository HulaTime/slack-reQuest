import Block from '../blocks/Block';

export interface IMessagePayload {
  text: string;
  blocks?: Block[];
  thread_ts?: string; 
  mrkdwn?: boolean;
}

export type SlackMessagePayload = {
  text: string;
  blocks?: Record<string, unknown>[];
  thread_ts?: string; 
  mrkdwn?: boolean;
}

export default class MessagePayload implements IMessagePayload {
  text: string;

  blocks: Block[];

  constructor(notificationText: string, blocks: Block[]) {
    this.text = notificationText;
    this.blocks = blocks;
  }

  render(): SlackMessagePayload {
    return {
      text: this.text,
      blocks: this.blocks.map(block => block.render()),
    }; 
  }
}
