/**
 * https://api.slack.com/reference/interaction-payloads/block-actions
 * I'm no including every field in these examples, just a minimum set of fields the app might require
 * Slack documentation is poor, and out of date, and often wrong... so trying to keep this accurate
 * will be a PITA.
*/

export interface InteractionAction {
  block_id: string;
  action_id: string;
  value?: string;
  type: string;
}

export interface InteractionPayload {
  type: string; 
  trigger_id: string; 
  user: {
    id: string;
    username: string;
    team_id: string;
  };
  team: null | {
    id: string;
    domain: string;
  };
  channel?: {
    id: string;
    name: string;
  };
  container: unknown; // This is an object that varies, can't be bothered to understand it right now
  api_app_id: string;
  actions: InteractionAction[];
}
