import { GraphQLClient } from 'graphql-request';

const HYGRAPH_ENDPOINT =
  process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT ||
  'https://api-ap-south-1.hygraph.com/v2/cmu9midei031l06uwod91ln43/master';

export const hygraphClient = new GraphQLClient(HYGRAPH_ENDPOINT, {
  headers: {
    ...(process.env.HYGRAPH_PERMANENT_AUTH_TOKEN && {
      Authorization: `Bearer ${process.env.HYGRAPH_PERMANENT_AUTH_TOKEN}`,
    }),
  },
});