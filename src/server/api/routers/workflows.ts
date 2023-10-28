import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
} from "~/server/api/trpc";

export const workflowRouter = createTRPCRouter({
  create: adminProcedure
    .input(z.object({ 
      name: z.string(),
      stages: z.array(z.object({ id: z.number() })),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log({ input })
      const workflow = await ctx.db.workflow.create({
        data: {
          name: input.name,
        },
      });
      // create the stage in workflow records
      await ctx.db.stageInWorkflow.createMany({
        data: input.stages.map(stage => ({
          stageId: stage.id,
          order: input.stages.findIndex(s => s.id === stage.id),
          workflowId: workflow.id,
        }))
      });
      // return the new workflow
      return await ctx.db.workflow.findUnique({
        where: {
          id: workflow.id
        },
        include: {
          stages: true
        }
      });
    }),
  getAll: protectedProcedure
    .input(z.object({
      includeStages: z.boolean().optional().default(true),
    }))
    .query(({ ctx, input }) => {
      return ctx.db.workflow.findMany({
        include: {
          stages: input.includeStages,
        }
      });
    }),
  update: adminProcedure
    .input(z.object({ 
      id: z.number(),
      name: z.string(),
      stages: z.array(z.object({ id: z.number() })),
    }))
    .mutation(async ({ input, ctx }) => {
      // fetch the workflow
      const workflow = await ctx.db.workflow.findUnique({
        where: {
          id: input.id
        },
        include: {
          stages: true
        }
      });
      if (!workflow) {
        throw new Error(`Workflow with id ${input.id} not found`);
      }
      // update the workflow
      await ctx.db.workflow.update({
        where: {
          id: input.id
        },
        data: {
          name: input.name
        }
      });
      // delete all stages in workflow
      await ctx.db.stageInWorkflow.deleteMany({
        where: {
          workflowId: input.id
        }
      });
      // create the stage in workflow records
      await ctx.db.stageInWorkflow.createMany({
        data: input.stages.map(stage => ({
          stageId: stage.id,
          order: input.stages.findIndex(s => s.id === stage.id),
          workflowId: workflow.id,
        }))
      });
      // return the new workflow
      return await ctx.db.workflow.findUnique({
        where: {
          id: workflow.id
        },
        include: {
          stages: true
        }
      });
    }),
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
      includeStages: z.boolean().optional().default(true),
    }))
    .query(({ ctx, input }) => {
      return ctx.db.workflow.findUnique({
        where: {
          id: input.id
        },
        include: {
          stages: input.includeStages,
        }
      });
    }),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input, ctx }) => {
      return ctx.db.workflow.delete({
        where: {
          id: input.id
        }
      });
    }),
});
