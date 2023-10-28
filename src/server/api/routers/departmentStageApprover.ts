import { z } from "zod";

import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const departmentStageApproverRouter = createTRPCRouter({
  createOrUpdate: adminProcedure
    .input(z.object({ departmentId: z.number(), stageId: z.number(), userId: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.db.departmentStageApprover.upsert({
        where: {
          stageId_departmentId_userId: {
            departmentId: input.departmentId,
            stageId: input.stageId,
            userId: input.userId,
          },
        },
        create: {
          departmentId: input.departmentId,
          stageId: input.stageId,
          userId: input.userId,
        },
        update: {},
      });
    }),
  delete: adminProcedure
    .input(z.object({ departmentId: z.number(), stageId: z.number(), userId: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.db.departmentStageApprover.delete({
        where: {
          stageId_departmentId_userId: {
            departmentId: input.departmentId,
            stageId: input.stageId,
            userId: input.userId,
          }
        },
      });
    }),
  getAll: protectedProcedure
    .query(({ ctx }) => {
      return ctx.db.departmentStageApprover.findMany();
    }),
  getAllByDepartmentIdAndStageIds: protectedProcedure
    .input(z.object({ 
      departmentId: z.number(),
      stageIds: z.array(z.number()),
    }))
    .query(({ input, ctx }) => {
      return ctx.db.departmentStageApprover.findMany({
        where: {
          departmentId: input.departmentId,
          stageId: {
            in: input.stageIds,
          },
        },
        include: {
          stage: true,
          approver: true,
        }
      });
    }),
});
