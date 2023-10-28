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
    }))
    .mutation(({ input, ctx }) => {
      console.log({ input })
      return ctx.db.exchange.create({
        data: {
          name: input.name,
          description: input.description,
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
  getAll: protectedProcedure
    .input(z.object({
      includeParticipants: z.boolean().optional().default(false),
      includeRecruiters: z.boolean().optional().default(false),
    }))
    .query(async ({ ctx }) => {
      return await ctx.db.exchange.findMany();
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
