import { z } from "zod";
import { REQUEST_FIELD_TYPES } from "~/constants/request";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";
export const requestFieldRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      includeOptions: z.boolean().optional().default(true),
    }))
    .query(({ ctx, input }) => {
      return ctx.db.requestField.findMany({
        include: {
          options: input.includeOptions,
        }
      });
    }),
  getByRequestType: protectedProcedure
    .input(z.object({ 
      requestTypeId: z.number(),
    }))
    .query(({ input, ctx }) => {
      return ctx.db.requestFieldInRequestType.findMany({
        where: {
          requestTypeId: input.requestTypeId,
        },
        include: {
          requestField: {
            include: {
              options: true,
            }
          },
        },
        orderBy: {
          order: 'asc',
        },
      });
    }),
  create: adminProcedure
    .input(z.object({ 
      name: z.string(),
      type: z.enum(REQUEST_FIELD_TYPES),
      options: z.array(z.number()).optional(),
    }))
    .mutation(({ input, ctx }) => {
      console.log({ input })
      return ctx.db.requestField.create({
        data: {
          name: input.name,
          type: input.type,
          options: input.options ? {
            connect: input.options?.map((option) => ({
              id: option,
            })),
          } : undefined,
        },
      });
    }),
  update: adminProcedure
    .input(z.object({ 
      id: z.number(), 
      name: z.string(),
      type: z.enum(REQUEST_FIELD_TYPES),
      options: z.array(z.number()).optional(),
    }))
    .mutation(({ input, ctx }) => {
      return ctx.db.requestField.update({
        where: {
          id: input.id
        },
        data: {
          name: input.name,
          type: input.type,
          options: input.options ? {
            connect: input.options?.map((option) => ({
              id: option,
            })),
          } : undefined,
        }
      });
    }),
  linkToRequestType: adminProcedure
    .input(z.array(z.object({ 
      requestFieldId: z.number(), 
      order: z.number(),
      requestTypeId: z.number(),
    })))
    .mutation(async ({ input, ctx }) => {
      // delete any existing links
      await ctx.db.requestFieldInRequestType.deleteMany({
        where: {
          requestTypeId: {
            in: input.map((item) => item.requestTypeId),
          },
        },
      });
      // create the new links
      return ctx.db.requestFieldInRequestType.createMany({
        data: input.map((item) => ({
          requestFieldId: item.requestFieldId,
          requestTypeId: item.requestTypeId,
          order: item.order,
        })),
      });
    }),
});