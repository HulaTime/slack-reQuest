type Style = {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  highlight: boolean;
  client_highlight: boolean;
  unlink: boolean;
}

export type SlackRichTextUserGroup = {
  type: 'usergroup';
  usergroup_id: string;
  style?: Style;
}

export default class RichTextUserGroup {
  private readonly type = 'usergroup';

  private readonly userGroupId: string;

  style: Style = {
    bold: false,
    italic: false,
    strike: false,
    highlight: false,
    client_highlight: false,
    unlink: false,
  };

  constructor(userGroupId: string) {
    this.userGroupId = userGroupId;
  };

  render(): SlackRichTextUserGroup {
    return {
      type: this.type,
      usergroup_id: this.userGroupId,
      style: this.style,
    };
  }
}
