"use client";
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '@/lib/apollo-client';

export function TeamsApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      {children}
    </ApolloProvider>
  );
}
