export const storyTypeDefs = `#graphql

scalar DateTime

type Story {
    id: ID!
    title: String!
    imageUrl: String!
    audioUrl: String!
    story: String!
    imagePrompt: String!
    status: String!
    prompt: String!
    email: String!
    createdAt: DateTime!
    updatedAt: DateTime!
}


type Query {
    stories(limit: Int, offset: Int): [Story]!
    story(id: String!): Story
}

type Mutation {
    createStory(prompt: String!, email: String!, userId: String!): Story!
}
`;
