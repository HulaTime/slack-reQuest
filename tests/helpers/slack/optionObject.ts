import { SlackTextObject } from './textObject';

// https://api.slack.com/reference/block-kit/composition-objects#option
export type SlackOptionObject = {
  text: SlackTextObject;
  value: string; // unique string that will be passed to app representing this option, max length 75 chars
  description?: string;
  url?: string; // A URL to load in the user's browser when the option is clicked. The url attribute is only available in overflow menus. Maximum length for this field is 3000 characters. If you're using url, you'll still receive an interaction payload and will need to send an acknowledgement response.
}

export default (text: SlackTextObject, value: string): SlackOptionObject => ({
  text,
  value,
});
