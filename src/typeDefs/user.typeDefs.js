export const userTypeDefs = `#graphql

scalar DateTime

type User {
  id: ID!
  name: String
  username: String
  email: String!
  password: String
  emailVerified: DateTime
  image: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
    userByEmail(email: String!): User
    userById(id: String!): User
}
`;
