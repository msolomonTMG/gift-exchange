import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import isAllowedToViewRequest from "~/server/api/utils/isAllowedToViewRequest";

export const requestEventRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ 
      requestId: z.number(),
      userId: z.string(),
      action: z.string(),
      value: z.string(),
    }))
    .mutation(({ input, ctx }) => {
      return ctx.db.requestEvent.create({
        data: {
          requestId: input.requestId,
          userId: input.userId,
          action: input.action,
          value: input.value,
        },
      });
    }),
  getAllByRequestId: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      includeUser: z.boolean().default(false),
    }))
    .query(async ({ input, ctx }) => {
      // user must be allowed to view the request
      const isAllowed = await isAllowedToViewRequest({
        props: {
          requestId: input.requestId,
          userId: ctx.session.user.id,
          ctx,
        },
      });
      if (!isAllowed) {
        throw new Error("UNAUTHORIZED");
      }
      return ctx.db.requestEvent.findMany({
        where: {
          requestId: input.requestId,
        },
        include: {
          user: input.includeUser,
        }
      });
    }),
  getAll: protectedProcedure
    .query(({ ctx }) => {
      return ctx.db.requestEvent.findMany();
    }),
});
