export type SlackTextObject = {
  type: 'plain_text' | 'mrkdown';
  text: string;
  emoji?: boolean; // Indicates whether emojis in a text field should be escaped into the colon emoji format. This field is only usable when type is plain_text.
  verbatim?: boolean; // When set to false (as is default) URLs will be auto-converted into links, conversation names will be link-ified, and certain mentions will be automatically parsed. When set to true, Slack will continue to process all markdown formatting and manual parsing strings, but it won’t modify any plain-text content. For example, channel names will not be hyperlinked. This field is only usable when type is mrkdwn.
}

export const slackPlainTextObject = (text: string, emoji?: boolean): SlackTextObject => ({
  type: 'plain_text',
  text,
  emoji,
});

export const slackMrkDownTextObject = (text: string, verbatim?: boolean): SlackTextObject => ({
  type: 'mrkdown',
  text,
  verbatim,
});

