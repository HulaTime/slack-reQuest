interface SlackMessagePayload {
  text: string;
  blocks?: Array<unknown>;
  thread_ts?: string; 
  mrkdwn?: boolean;
}

export default class MessagePayload {
  /** The main body of the message, unless you are using blocks in which case this is a fallback for
    * notifications. It can be formatted with plain text or markdown
  */
  text: string;

  /* An array of layout blocks */
  blocks?: Array<unknown>;

  /* The ID of another un-threaded message to reply to */
  threadTs?: string; 

  /* Determines whether the text field is rendered according to mrkdwn formatting or not */
  isMarkdownEnabled?: boolean = true;

  constructor(data: SlackMessagePayload) {
    this.text = data.text;
    this.blocks = data.blocks;
    this.threadTs = data.thread_ts;
    this.isMarkdownEnabled = data.mrkdwn;
  }
}
