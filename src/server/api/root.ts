import { emailRouter } from "~/server/api/routers/email";
import { exchangeRouter } from "~/server/api/routers/exchange";
import { giftRouter } from "~/server/api/routers/gift";
import { userRouter } from "~/server/api/routers/user";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  email: emailRouter,
  exchange: exchangeRouter,
  gift: giftRouter,
  user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
