import 'server-only';
import { GraphQLClient } from 'graphql-request';

const endpoint =
  process.env.HYGRAPH_ENDPOINT ||
  process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT;

const token = process.env.HYGRAPH_PERMANENT_AUTH_TOKEN;

if (!endpoint || !endpoint.startsWith('https://')) {
  throw new Error('Invalid or missing HYGRAPH_ENDPOINT');
}

if (!token || token === '...') {
  throw new Error('Missing HYGRAPH_PERMANENT_AUTH_TOKEN');
}

export const hg = new GraphQLClient(endpoint, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});