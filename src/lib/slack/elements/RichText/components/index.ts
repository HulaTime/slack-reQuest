import RichTextChannel from './RichTextChannel';
import RichTextEmoji from './RichTextEmoji';
import RichTextLink from './RichTextLink';
import RichTextText from './RichTextText';
import RichTextUser from './RichTextUser';
import RichTextUserGroup from './RichTextUserGroup';

export type RichTextComponents = 
  RichTextChannel | 
  RichTextEmoji | 
  RichTextLink | 
  RichTextText | 
  RichTextUser | 
  RichTextUserGroup;

export default {
  RichTextChannel,
  RichTextEmoji,
  RichTextLink,
  RichTextText,
  RichTextUser,
  RichTextUserGroup,
};

