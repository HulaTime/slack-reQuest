export type SlackDispatchActionConfig = {
  trigger_actions_on: 'on_enter_pressed' | 'on_character_pressed';  
}

export default class DispatchActionConfiguration {
  constructor(private readonly triggerActionEvent: 'onEnter' | 'onKeyPress') {}

  render(): SlackDispatchActionConfig {
    return { trigger_actions_on: this.triggerActionEvent === 'onEnter' ? 'on_enter_pressed' : 'on_character_pressed' };
  }
}
