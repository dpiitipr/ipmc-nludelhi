import { gql } from 'graphql-request';

export const GET_VIDHI_CONTENT = gql`
  query GetVidhiContent {
    vidhiMarketings(first: 1) {
      id
      aboutMoot
      studentConvenors
      timeline {
        title
        startDate
        endDate
      }
      resources {
        id
        title
        file {
          id
          url
          fileName
          mimeType
        }
      }
    }

    pastEditions(orderBy: year_DESC) {
      id
      title
      edition
      year
      theme
      description
      finalVideoUrl
      valedictoryVideoUrl

      materials {
        id
        title
        file {
          id
          url
          fileName
          mimeType
        }
      }

      organisingCommitteePhotos {
        id
        url
        fileName
      }
    }
  }
`;