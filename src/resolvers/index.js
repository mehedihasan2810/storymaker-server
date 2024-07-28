import { storyResolver } from "./story.resolver.js";
// import { userResolver } from "./user.resolver.js";

export const resolvers = {
  Query: {
    // ...userResolver.Query,
    ...storyResolver.Query,
  },
  Mutation: {
    // ...userResolver.Mutation,
    ...storyResolver.Mutation,
  },
};
