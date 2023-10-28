import { z } from "zod";

import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const departmentRouter = createTRPCRouter({
  create: adminProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input, ctx }) => {
      console.log({ input })
      return ctx.db.department.create({
        data: {
          name: input.name,
        },
      });
    }),
  getAll: protectedProcedure
    .input(z.object({
      includeParticipants: z.boolean().optional().default(false),
      includeRecruiters: z.boolean().optional().default(false),
    }))
    .query(({ input, ctx }) => {
      return ctx.db.department.findMany({
        include: {
          participants: input.includeParticipants,
          recruiters: input.includeRecruiters,
        }
      });
    }),
  updateRecruiters: adminProcedure
    .input(z.object({
      departmentId: z.number(),
      userIds: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.department.update({
        where: {
          id: input.departmentId
        },
        data: {
          recruiters: {
            set: input.userIds.map(userId => ({ id: userId }))
          }
        }
      });
    }),
  updateParticipants: adminProcedure
    .input(z.object({
      departmentId: z.number(),
      userIds: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.department.update({
        where: {
          id: input.departmentId
        },
        data: {
          participants: {
            set: input.userIds.map(userId => ({ id: userId }))
          }
        }
      });
    }),
});
