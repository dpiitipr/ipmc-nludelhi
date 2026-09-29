import { gql } from 'graphql-request';

export const GET_HOME_PORTAL_DATA = gql`
  query GetHomePortalData {
    competitions(where: { edition: "3rd Edition" }, first: 1) {
      title
      edition
      year
      tagline
      announcementHeader
    }
    schedules(orderBy: isoDate_ASC) {
      event
      dateStr
      isoDate
    }
    organisers(orderBy: order_ASC) {
      id
      name
      role
      link
      logo {
        url
      }
    }
  }
`;