import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const exchangeRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ 
      name: z.string(),
      description: z.string(),
      slug: z.string(),
    }))
    .mutation(({ input, ctx }) => {
      console.log({ input })
      return ctx.db.exchange.create({
        data: {
          name: input.name,
          description: input.description,
          slug: input.slug,
          creator: {
            connect: {
              id: ctx.session.user.id
            }
          },
          participants: {
            connect: {
              id: ctx.session.user.id
            }
          }
        },
      });
    }),
  update: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      slug: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // check to make sure the user is the creator of the exchange or an admin
      const currentUserId = ctx.session.user.id;
      const isAdmin = ctx.session.user.isAdmin;
      const exchange = await ctx.db.exchange.findUniqueOrThrow({
        where: { id: input.id },
      });
      const isExchangeCreator = exchange.creatorId === currentUserId;
      if (!isExchangeCreator && !isAdmin) {
        throw new Error("You are not authorized to update this exchange");
      }
      return ctx.db.exchange.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          slug: input.slug,
        },
      });
    }),
  addParticipant: protectedProcedure
    .input(z.object({ 
      exchangeId: z.number(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // check to make sure the user adding a participant is an admin or a participant of the exchange
      const currentUserId = ctx.session.user.id;
      const isAdmin = ctx.session.user.isAdmin;
      const isParticipant = await ctx.db.exchange.findUnique({
        where: { id: input.exchangeId },
        select: {
          participants: {
            where: { id: currentUserId }
          }
        }
      });
      if (!isParticipant && !isAdmin) {
        throw new Error("You are not authorized to add a participant to this exchange");
      }
      return await ctx.db.exchange.update({
        where: { id: input.exchangeId },
        data: {
          participants: {
            connect: {
              id: input.userId
            }
          }
        },
      });
    }),
  removeParticipant: protectedProcedure
    .input(z.object({ 
      exchangeId: z.number(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // check to make sure the user removing a participant is an admin or creator of the exchange
      const currentUserId = ctx.session.user.id;
      const isAdmin = ctx.session.user.isAdmin;
      const exchange = await ctx.db.exchange.findUniqueOrThrow({
        where: { id: input.exchangeId },
      });
      const isExchangeCreator = exchange.creatorId === currentUserId;
      if (!isExchangeCreator && !isAdmin) {
        throw new Error("You are not authorized to remove a participant from this exchange");
      }
      return await ctx.db.exchange.update({
        where: { id: input.exchangeId },
        data: {
          participants: {
            disconnect: {
              id: input.userId
            }
          }
        },
      });
    }),
  getExchangesParticipating: protectedProcedure
    .input(z.object({
      includeCreator: z.boolean().optional().default(false),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.exchange.findMany({
        where: {
          participants: {
            some: {
              id: ctx.session.user.id
            }
          }
        },
        include: {
          creator: input.includeCreator,
        }
      });
    }),
  getAll: protectedProcedure
    .input(z.object({
      includeCreator: z.boolean().optional().default(false),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.exchange.findMany({
        include: {
          creator: input.includeCreator,
        }
      });
    }),
  getBySlug: protectedProcedure
    .input(z.object({ 
      slug: z.string(),
      includeGifts: z.boolean().optional().default(false),
    }))
    .query(async ({ input, ctx }) => {
      const exchange = await ctx.db.exchange.findUniqueOrThrow({
        where: { slug: input.slug },
        include: {
          participants: true,
          creator: true,
          gifts: input.includeGifts,
        }
      });
      // if the user isnt a recruiter, participant, stageApprover, creator, or is not an admin, throw an error
      const currentUserId = ctx.session.user.id;
      const isParticipant = exchange.participants.find((participant) => participant.id === currentUserId);
      const isCreator = exchange.creator.id === currentUserId;
      const isAdmin = ctx.session.user.isAdmin;
      if (!isParticipant && !isCreator && !isAdmin) {
        throw new Error("You are not authorized to view this exchange");
      }
      return exchange;
    }),
  getById: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      includeParticipants: z.boolean().optional().default(true),
      includeCreator: z.boolean().optional().default(true),
      includeGifts: z.boolean().optional().default(false),
    }))
    .query(async ({ input, ctx }) => {
      console.log({ input })
      const exchange = await ctx.db.exchange.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          participants: input.includeParticipants,
          creator: input.includeCreator,
          gifts: input.includeGifts,
        }
      });
      // if the user isnt a recruiter, participant, stageApprover, creator, or is not an admin, throw an error
      const currentUserId = ctx.session.user.id;
      const isParticipant = exchange.participants.find((participant) => participant.id === currentUserId);
      const isCreator = exchange.creator.id === currentUserId;
      const isAdmin = ctx.session.user.isAdmin;
      if (!isParticipant && !isCreator && !isAdmin) {
        throw new Error("You are not authorized to view this exchange");
      }
      return exchange;
    }),
    
});
