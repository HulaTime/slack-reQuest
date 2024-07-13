export type SlashCommandPayload = {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
  api_app_id?: string; // Optional: present if the command is invoked in a workspace where your app is installed
  enterprise_id?: string; // Optional: present for Enterprise Grid workspaces
  enterprise_name?: string; // Optional: present for Enterprise Grid workspaces
  // Depending on the command's configuration, additional optional fields might be included. Consider extending this type accordingly.
};
