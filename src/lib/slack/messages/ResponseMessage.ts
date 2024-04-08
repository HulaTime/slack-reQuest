import Block from '../blocks/Block';

import MessagePayload, { SlackMessagePayload } from './MessagePayload';

export type SlackResponseMessage = SlackMessagePayload & {
  replace_original: 'true' | 'false';
  response_type: 'in_channel' | 'ephemeral';
}

export default class ResponseMessage extends MessagePayload {
  private replaceOriginal: boolean = false;

  private responseType: 'in_channel' | 'ephemeral' = 'in_channel';

  constructor(notificationText: string, blocks: Block[]) {
    super(notificationText, blocks);
  }

  shouldReplaceOriginal(option: boolean): this {
    this.replaceOriginal = option;
    return this;
  }
  
  setResponseType(type: 'in_channel' | 'ephemeral'): this {
    this.responseType = type;
    return this;
  }

  render(): SlackResponseMessage {
    return { 
      text: this.text,
      blocks: this.blocks.map(b => b.render()),
      replace_original: this.replaceOriginal.toString() as 'true' | 'false',
      response_type: this.responseType,
    };
  }
}
