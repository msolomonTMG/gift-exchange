import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const stageRouter = createTRPCRouter({
  create: adminProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.db.stage.create({
        data: {
          name: input.name,
        },
      });
    }),
  getAll: protectedProcedure
    .query(({ ctx }) => {
      return ctx.db.stage.findMany();
    }),
});
