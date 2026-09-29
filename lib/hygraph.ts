import { GraphQLClient } from 'graphql-request';

const hygraphEndpoint = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT || '';

export const hygraphClient = new GraphQLClient(hygraphEndpoint, {
  headers: {
    ...(process.env.HYGRAPH_TOKEN && {
      Authorization: `Bearer ${process.env.HYGRAPH_TOKEN}`,
    }),
  },
});