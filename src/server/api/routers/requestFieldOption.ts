import { z } from "zod";

import {
  createTRPCRouter,
  adminProcedure,
} from "~/server/api/trpc";
export const requestFieldOptionRouter = createTRPCRouter({
  create: adminProcedure
    .input(z.object({ 
      name: z.string(),
      requestFieldId: z.number().optional().nullable(),
    }))
    .mutation(({ input, ctx }) => {
      return ctx.db.requestFieldOption.create({
        data: {
          name: input.name,
          requestFieldId: input.requestFieldId,
        },
      });
    }),
  update: adminProcedure
    .input(z.object({ 
      id: z.number(), 
      name: z.string(),
      requestFieldId: z.number().optional().nullable(),
    }))
    .mutation(({ input, ctx }) => {
      return ctx.db.requestFieldOption.update({
        where: {
          id: input.id
        },
        data: {
          name: input.name,
          requestFieldId: input.requestFieldId,
        }
      });
    }),
  delete: adminProcedure
    .input(z.object({ 
      id: z.number(), 
    }))
    .mutation(({ input, ctx }) => {
      return ctx.db.requestFieldOption.delete({
        where: {
          id: input.id
        },
      });
    }),
});