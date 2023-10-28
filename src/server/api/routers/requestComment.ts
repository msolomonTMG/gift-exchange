import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import isAllowedToViewRequest from "~/server/api/utils/isAllowedToViewRequest";
import sendEmail from "~/server/api/utils/sendEmail";

export const requestCommentRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      comment: z.string() 
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // the user must be allowed to view the request
        const isAllowed = await isAllowedToViewRequest({
          props: {
            requestId: input.requestId,
            userId: ctx.session.user.id,
            ctx,
          },
        });
        if (!isAllowed) {
          throw new Error("UNAUTHORIZED");
        }
      } catch (e) {
        console.error({ e })
        throw e;
      }
      try {
        const request = await ctx.db.request.findUniqueOrThrow({
          where: { id: input.requestId },
          include: {
            participants: true,
            recruiters: true,
            creator: true,
          }
        });
        const allStageApprovers = await ctx.db.requestStageApprover.findMany({
          where: {
            requestId: request.id,
          },
          include: {
            user: true,
          }
        });
        const createdComment = await ctx.db.requestComment.create({
          data: {
            requestId: input.requestId,
            comment: input.comment,
            userId: ctx.session.user.id,
          },
        });
        const allUsersInvolved = [
          ...request.recruiters,
          ...request.participants,
          ...allStageApprovers.map((approver) => approver.user),
          request.creator,
        ];
        // users who choose to be emailed for any stage change
        const usersWithCommentAddedPreferenceOn = allUsersInvolved.filter((user) => 
          user.emailWhenRequestCommentedOn
        );
        // make one array of unique emails based on the preferences of the users
        const emailsToSend = [...new Set<string>([
          ...usersWithCommentAddedPreferenceOn.map((user) => user.email).filter(Boolean),
        ] as string[])];

        await sendEmail({
          props: {
            to: emailsToSend,
            subject: `REQ-${request.id} has a new comment`,
            body: `
              ${input.comment}
            
              <br />
              - ${ctx.session.user.name}
              <br />
              Reply here: ${process.env.NEXTAUTH_URL}/request/${request.id}
            `,
            ctx,
          }
        });
        return createdComment;
      } catch (e) {
        console.error({ e })
      }
    }),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      comment: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const comment = await ctx.db.requestComment.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!comment) {
        throw new Error("NOT_FOUND");
      }
      // only the comment user can update the comment
      if (comment.userId !== ctx.session.user.id) {
        throw new Error("UNAUTHORIZED");
      }
      return await ctx.db.requestComment.update({
        where: {
          id: input.id,
        },
        data: {
          comment: input.comment,
        },
      });
    }),
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const comment = await ctx.db.requestComment.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!comment) {
        throw new Error("NOT_FOUND");
      }
      // only the comment user or admin can update the comment
      if ((comment.userId !== ctx.session.user.id) && !ctx.session.user.isAdmin) {
        throw new Error("UNAUTHORIZED");
      }
      return await ctx.db.requestComment.delete({
        where: {
          id: input.id,
        },
      });
    }),
  getAllByRequestId: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      includeUser: z.boolean().default(false),
    }))
    .query(async ({ input, ctx }) => {
      // the user must be allowed to view the request
      const isAllowed = await isAllowedToViewRequest({
        props: {
          requestId: input.requestId,
          userId: ctx.session.user.id,
          ctx,
        },
      });
      console.log({ isAllowed })
      if (!isAllowed) {
        throw new Error("UNAUTHORIZED");
      }
      return await ctx.db.requestComment.findMany({
        where: {
          requestId: input.requestId,
        },
        include: {
          user: input.includeUser,
        }
      });
    }),
});
