import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const requestStatusRouter = createTRPCRouter({
  create: adminProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.db.requestStatus.create({
        data: {
          name: input.name,
        },
      });
    }),
  update: adminProcedure
    .input(z.object({ 
      id: z.number(),
      name: z.string(),
    }))
    .mutation(({ input, ctx }) => {
      return ctx.db.requestStatus.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      });
    }),
  getAll: protectedProcedure
    .query(({ ctx }) => {
      return ctx.db.requestStatus.findMany();
    }),
});
