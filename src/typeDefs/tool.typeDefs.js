export const toolTypeDefs = `#graphql

scalar DateTime

type Suggestions {
    id: String
    name: String
    email: String
    reason: String
    suggestion: String
    createdAt: String
    updatedAt: String
}

type Tool {
    id: ID!
    name: String
    title: String
    url: String
    shortUrl: String
    logo: String
    image: String
    category: String
    categories: [String]
    pricingModel: String
    features: [String]
    blog: String
    label: String
    suggestions: [Suggestions]
    status: String
    createdAt: DateTime!
    updatedAt: DateTime!
}

type OldTool {
    id: ID!
    name: String
    title: String
    description: String
    url: String
    summary: String
    tags: [String]
    additionalTags: [String]
    image: String
    pricingModel: String
    suggestions: [Suggestions]
    likes: Int
    likedUsers: [String]
    status: String
    createdAt: DateTime!
    updatedAt: DateTime!
}

input SuggestionsInput {
    id: String
    name: String
    email: String
    reason: String
    suggestion: String
    createdAt: String
    updatedAt: String
}

type GenerateToolRes {
    data: String
    error: String
}

type SignedUrl {
  imageFile: String
  logoFile: String
}

type MutationSongResponse {
  error: String
  data: String
}

input CreateToolInput {
    name: String
    description: String
    url: String
    shortUrl: String
    profileImage: String
    image: String
    category: String
    categories: [String]
    pricingModel: String
    feature: String
    blog: String
    label: String
    suggestions: [SuggestionsInput]
    status: String
}

input UpdateToolInput {
    id: String
    name: String
    title: String
    url: String
    shortUrl: String
    image: String
    logo: String
    category: String
    categories: [String]
    pricingModel: String
    features: [String]
    blog: String
    label: String
    suggestions: [SuggestionsInput]
    status: String
}

input StatusInput {
    id: String!
    status: String!
}

input SignedUrlInput {
  keyName: String!,
  fileType: String!,
  fileSize: Int!,
  checksum: String!,
  fileName: String!
}


type Query {
    tools: [Tool!]!
    tool(id: String!): Tool
    publishedTools: [Tool!]!

    oldTools: [OldTool!]!
    oldTool(id: String!): OldTool
    publishedOldTools(limit: Int): [OldTool!]!
    searchTools(query: String!, pricing: [String], categories: [String], sortBy: String!, limit: Int): [OldTool!]!

    heroSearchTools(query: String!): [OldTool!]!

    signedUrl(signedUrlInput: [SignedUrlInput!]!): SignedUrl!
}

type Mutation {
    createTool(tool: CreateToolInput): Tool
    updateTool(tool: UpdateToolInput): Tool
    deleteTool(id: String, logoUrl: String, imageUrl: String): Tool
    updateStatus(statusInput: StatusInput): Tool
    generateTool(url: String): Tool
    deleteFile(deleteFileInput: String!): MutationSongResponse!
}
`;
