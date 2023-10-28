import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const requestTypeRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(({ ctx }) => {
      return ctx.db.requestType.findMany();
    }),
  create: adminProcedure
    .input(z.object({ 
      name: z.string(),
      description: z.string().optional(),
      workflowId: z.number(),
      requestFieldInRequestType: z.array(z.number()).optional(),
    }))
    .mutation(({ input, ctx }) => {
      return ctx.db.requestType.create({
        data: {
          name: input.name,
          description: input.description,
          workflowId: input.workflowId,
          requestFieldInRequestType: input.requestFieldInRequestType ? {
            connect: input.requestFieldInRequestType?.map((requestField) => ({
              id: requestField,
            })),
          } : undefined,
        },
      });
    }),
  update: adminProcedure
    .input(z.object({ 
      id: z.number(), 
      name: z.string(),
      description: z.string().optional(),
      workflowId: z.number(),
      requestFieldInRequestType: z.array(z.number()).optional(),
    }))
    .mutation(({ input, ctx }) => {
      return ctx.db.requestType.update({
        where: {
          id: input.id
        },
        data: {
          name: input.name,
          description: input.description,
          workflowId: input.workflowId,
          requestFieldInRequestType: input.requestFieldInRequestType ? {
            connect: input.requestFieldInRequestType?.map((requestField) => ({
              id: requestField,
            })),
          } : undefined,
        }
      });
    }),
});