import * as microsoftTeams from "@microsoft/teams-js";

// Initialize Teams
export const initializeTeams = async () => {
  try {
    await microsoftTeams.app.initialize();
    return true;
  } catch (error) {
    console.error('Failed to initialize Teams:', error);
    return false;
  }
};

// Get Teams Context
export const getTeamsContext = async () => {
  try {
    const context = await microsoftTeams.app.getContext();
    return context;
  } catch (error) {
    console.error('Failed to get Teams context:', error);
    return null;
  }
};

// Teams API Calls
export const getChannels = async (teamId: string) => {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/teams/${teamId}/channels`,
    {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
      },
    }
  );
  return response.json();
};

export const getTeamMembers = async (teamId: string) => {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/teams/${teamId}/members`,
    {
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
      },
    }
  );
  return response.json();
};

export const sendChannelMessage = async (channelId: string, content: string) => {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: {
          content,
        },
      }),
    }
  );
  return response.json();
};

async function getAccessToken() {
  const response = await fetch('/api/auth/teams-token');
  const data = await response.json();
  return data.accessToken;
}
