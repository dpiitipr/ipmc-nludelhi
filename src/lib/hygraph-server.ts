import { GraphQLClient } from 'graphql-request';

export const hg = new GraphQLClient(process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT!, {
  headers: { Authorization: `Bearer ${process.env.HYGRAPH_PERMANENT_AUTH_TOKEN}` },
});