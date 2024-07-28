import { db } from "../lib/db/index.js";

export const userResolver = {
  Query: {
    async userByEmail(
      _,
      { email }
    ) {
      console.log({ email });

      const userRes = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, email),
      });

      return userRes || null;

      // return { id: "1", email: "user@gmail.com", password: "passs" };
    },

    async userById(_, { id }) {
      console.log({ id });

      const userRes = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, id),
      });

      return userRes;

      // return { id: "1", email: "user@gmail.com", password: "passs" };
    },
  },
  // Mutation: {},
};
