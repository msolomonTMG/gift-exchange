import { emailRouter } from "~/server/api/routers/email";
import { exchangeRouter } from "~/server/api/routers/exchange";
import { departmentRouter } from "~/server/api/routers/department";
import { departmentStageApproverRouter } from "~/server/api/routers/departmentStageApprover";
import { giftRouter } from "~/server/api/routers/gift";
import { requestRouter } from "~/server/api/routers/request";
import { requestCommentRouter } from "~/server/api/routers/requestComment";
import { requestEventRouter } from "~/server/api/routers/requestEvent";
import { requestFieldRouter } from "~/server/api/routers/requestField";
import { requestFieldOptionRouter } from "~/server/api/routers/requestFieldOption";
import { requestStatusRouter } from "./routers/requestStatus";
import { requestTypeRouter } from "~/server/api/routers/requestType";
import { stageRouter } from "~/server/api/routers/stages";
import { userRouter } from "~/server/api/routers/user";
import { workflowRouter } from "~/server/api/routers/workflows";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  email: emailRouter,
  exchange: exchangeRouter,
  department: departmentRouter,
  departmentStageApprover: departmentStageApproverRouter,
  gift: giftRouter,
  request: requestRouter,
  requestComment: requestCommentRouter,
  requestEvent: requestEventRouter,
  requestField: requestFieldRouter,
  requestFieldOption: requestFieldOptionRouter,
  requestStatus: requestStatusRouter,
  requestType: requestTypeRouter,
  stage: stageRouter,
  user: userRouter,
  workflow: workflowRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
