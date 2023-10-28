import { z } from "zod";

import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(({ ctx }) => {
      return ctx.db.user.findMany();
    }),
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.db.user.findUnique({
        where: { id: input.id },
      });
    }),
  create: adminProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
      isAdmin: z.boolean(),
      image: z.string().url(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.db.user.create({
        data: {
          email: input.email,
          name: input.name,
          isAdmin: input.isAdmin,
          image: input.image,
        },
      });
    }),
  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input, ctx }) => {
      return ctx.db.user.delete({
        where: { id: input.id },
      });
    }),
  setAdminStatus: adminProcedure
    .input(z.object({ id: z.string(), isAdmin: z.boolean() }))
    .mutation(({ input, ctx }) => {
      return ctx.db.user.update({
        where: { id: input.id },
        data: { isAdmin: input.isAdmin },
      });
    }),
  updatePreferences: protectedProcedure
    .input(z.object({
      id: z.string(),
      emailWhenRequestStageChanged: z.boolean(),
      emailWhenRequestCommentedOn: z.boolean(),
      emailWhenAwaitingMyRequestApproval: z.boolean(),
      emailWhenRequestCreated: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      // user making the update must be the same as the user being updated or an admin
      if (ctx.session?.user?.id !== input.id && !ctx.session?.user?.isAdmin) {
        throw new Error('UNAUTHORIZED');
      }
      return await ctx.db.user.update({
        where: { id: input.id },
        data: {
          emailWhenRequestStageChanged: input.emailWhenRequestStageChanged,
          emailWhenRequestCommentedOn: input.emailWhenRequestCommentedOn,
          emailWhenAwaitingMyRequestApproval: input.emailWhenAwaitingMyRequestApproval,
          emailWhenRequestCreated: input.emailWhenRequestCreated,
        },
      });
    }),
});
