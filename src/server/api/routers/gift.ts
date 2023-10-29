import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

async function fetchOGImage(url: string, timeout = 5000): Promise<string | null | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response: Response = await fetch(url, { signal: controller.signal });
    const reader = response.body?.getReader();

    const chunks: Uint8Array[] = [];
    let found = false;
    let ogImageContent: string | null | undefined = null;

    if (reader) {
      while (!found) {
        const { done, value } = await reader.read();

        if (done) break;

        if (value) {
          chunks.push(value);
          const joinedChunksArray: number[] = ([] as number[]).concat(...chunks.map(chunk => Array.from(chunk)));
          const joinedChunks = new TextDecoder().decode(new Uint8Array(joinedChunksArray));
          const ogImageMatch = /<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/.exec(joinedChunks);

          if (ogImageMatch) {
            ogImageContent = ogImageMatch[1];
            found = true;
          }
        }
      }
    }

    return ogImageContent;

  } catch (error) {
    console.error('Error fetching the og:image:', error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}


export const giftRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ 
      name: z.string(),
      description: z.string(),
      url: z.string().optional(),
      price: z.number().optional(),
      exchangeId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const image = await fetchOGImage(input.url ?? "");
      return ctx.db.gift.create({
        data: {
          name: input.name,
          description: input.description,
          image: image ?? null,
          url: input.url,
          price: input.price,
          exchangeId: input.exchangeId,
          requestorId: ctx.session.user.id,
        },
      });
    }),
  update: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      url: z.string().optional(),
      price: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const image = await fetchOGImage(input.url ?? "");
      return ctx.db.gift.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          image: image ?? null,
          url: input.url,
          price: input.price,
        },
      });
    }),
  delete: protectedProcedure
    .input(z.object({ 
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // the user calling delete must be the gift creator or an admin
      const gift = await ctx.db.gift.findUniqueOrThrow({
        where: { id: input.id },
      });
      if (gift.requestorId !== ctx.session.user.id && !ctx.session.user.isAdmin) {
        throw new Error("You are not authorized to delete this gift");
      }
      // find any purchases for this gift and delete them
      const purchase = await ctx.db.purchase.findUnique({
        where: { giftId: input.id },
      });
      if (purchase) {
        await ctx.db.purchase.delete({
          where: { id: purchase.id },
        });
      }
      return ctx.db.gift.delete({
        where: { id: input.id },
      });
    }),
  getAll: adminProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.gift.findMany({
        include: {
          exchange: true,
        }
      });
    }),
  getAllInExchange: protectedProcedure
    .input(z.object({
      exchangeId: z.number(),
      includeRequestor: z.boolean().optional().default(false),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.gift.findMany({
        where: {
          exchangeId: input.exchangeId,
        },
        include: {
          requestor: input.includeRequestor,
        }
      });
    }),
  getById: protectedProcedure
    .input(z.object({ 
      id: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.exchange.findUniqueOrThrow({
        where: { id: input.id },
      });
    }),
  getPurchaseByGift: protectedProcedure
    .input(z.object({ 
      giftId: z.number(),
      includePurchasers: z.boolean().optional().default(false),
    }))
    .query(async ({ input, ctx }) => {
      return await ctx.db.purchase.findUniqueOrThrow({
        where: { giftId: input.giftId },
        include: {
          purchasers: input.includePurchasers,
        }
      });
    }),
  addPurchaser: protectedProcedure
  .input(z.object({
    giftId: z.number(),
    userId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    const gift = await ctx.db.gift.findUniqueOrThrow({
      where: { id: input.giftId },
      include: { 
        purchase: true,
      }
    });
    const exchange = await ctx.db.exchange.findUniqueOrThrow({
      where: { id: gift.exchangeId },
      include: {
        participants: true,
      }
    });
    // ensure that the user making this request is an approver, participant, or recruiter for this request
    const currentUserId = ctx.session.user.id;
    const isParticipant = exchange.participants.find((participant) => participant.id === currentUserId);
    const isAdmin = ctx.session.user.isAdmin;
    if (!isParticipant && !isAdmin) {
      throw new Error("You are not authorized to add purchasers to this gift");
    }
    const purchase = await ctx.db.purchase.findUnique({
      where: { giftId: input.giftId },
      include: {
        purchasers: true,
      }
    });
    if (!purchase) {
      // create the purchase
      return await ctx.db.purchase.create({
        data: {
          giftId: input.giftId,
          purchasers: {
            connect: { id: input.userId },
          },
        },
      });
    }
    const isExistingPurchaser = purchase.purchasers.find((purchaser) => purchaser.id === input.userId);
    if (isExistingPurchaser) {
      throw new Error("Purchaser already exists for this gift");
    };
    // add the participant
    return await ctx.db.purchase.update({
      where: { id: purchase.id },
      data: {
        purchasers: {
          connect: { id: input.userId },
        },
      },
    });
  }),
  removePurchaser: protectedProcedure
    .input(z.object({
      giftId: z.number(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const gift = await ctx.db.gift.findUniqueOrThrow({
        where: { id: input.giftId },
        include: { 
          purchase: true,
        }
      });
      const exchange = await ctx.db.exchange.findUniqueOrThrow({
        where: { id: gift.exchangeId },
        include: {
          participants: true,
        }
      });
      // ensure that the user making this request is an approver, participant, or recruiter for this request
      const currentUserId = ctx.session.user.id;
      const isParticipant = exchange.participants.find((participant) => participant.id === currentUserId);
      const isAdmin = ctx.session.user.isAdmin;
      if (!isParticipant && !isAdmin) {
        throw new Error("You are not authorized to remove purchasers from this gift");
      }
      const purchase = await ctx.db.purchase.findUnique({
        where: { giftId: input.giftId },
        include: {
          purchasers: true,
        }
      });
      if (!purchase) {
        throw new Error("No purchasers exist for this gift");
      }
      const isExistingPurchaser = purchase.purchasers.find((purchaser) => purchaser.id === input.userId);
      if (!isExistingPurchaser) {
        throw new Error("Purchaser does not exist for this gift");
      };
      // add the participant
      return await ctx.db.purchase.update({
        where: { id: purchase.id },
        data: {
          purchasers: {
            disconnect: { id: input.userId },
          },
        },
      });
    }),
});
