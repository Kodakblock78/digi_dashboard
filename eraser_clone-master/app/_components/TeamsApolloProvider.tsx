"use client";
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';
import { useEffect } from 'react';
import { initializeTeams } from '@/lib/teams-service';

export function TeamsApolloProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Teams when the component mounts
    initializeTeams();
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}
