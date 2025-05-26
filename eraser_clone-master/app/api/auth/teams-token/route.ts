import { NextResponse } from 'next/server';
import * as microsoftTeams from "@microsoft/teams-js";

export async function GET() {
  try {
    // Initialize Teams context
    await microsoftTeams.app.initialize();
    
    // Get authentication token
    const token = await microsoftTeams.authentication.getAuthToken();
    
    // Exchange the token for an access token using OAuth2
    const accessToken = await exchangeTokenForAccessToken(token);
    
    return NextResponse.json({ accessToken });
  } catch (error) {
    console.error('Error getting Teams token:', error);
    return NextResponse.json(
      { error: 'Failed to get Teams token' },
      { status: 500 }
    );
  }
}

async function exchangeTokenForAccessToken(token: string) {
  // Replace these with your actual Azure AD app registration values
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const tenantId = process.env.AZURE_AD_TENANT_ID;
  
  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: token,
          requested_token_use: 'on_behalf_of',
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    );

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error exchanging token:', error);
    throw error;
  }
}
