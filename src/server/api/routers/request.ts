import { z } from "zod";

import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

import emitRequestEvent from "~/server/api/utils/emitRequestEvent";
import sendEmail from "~/server/api/utils/sendEmail";

export const requestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ 
      departmentId: z.number(),
      requestTypeId: z.number(),
      fields: z.array(z.object({
        requestFieldId: z.number(),
        value: z.string(),
      })),
     }))
    .mutation(async ({ input, ctx }) => {
      const requestType = await ctx.db.requestType.findUniqueOrThrow({
        where: { id: input.requestTypeId },
      });
      const workflow = await ctx.db.workflow.findUniqueOrThrow({
        where: { id: requestType.workflowId },
        include: { stages: true },
      });
      const firstStageOfWorkflow = await ctx.db.stageInWorkflow.findFirstOrThrow({
        where: { workflowId: workflow.id },
        include: { stage: true },
        orderBy: { order: "asc" },
      });
      const initialApprovers = await ctx.db.departmentStageApprover.findMany({
        where: { 
          stageId: firstStageOfWorkflow.stageId,
          departmentId: input.departmentId,
        },
      });
      if (initialApprovers.length === 0) {
        throw new Error("No approvers found for this request");
      }
      const allStageApprovers = await ctx.db.departmentStageApprover.findMany({
        where: {
          departmentId: input.departmentId,
        },
      });
      // add all participants to the request
      const department = await ctx.db.department.findUniqueOrThrow({
        where: { id: input.departmentId },
        include: { 
          participants: true,
          recruiters: true,
        },
      });
      const pendingStatus = await ctx.db.requestStatus.findUniqueOrThrow({
        where: { name: "Pending" },
      });
      const createdRequest = await ctx.db.request.create({
        data: {
          departmentId: input.departmentId,
          requestTypeId: input.requestTypeId,
          creatorId: ctx.session.user.id,
          stageId: firstStageOfWorkflow.stageId,
          currentApprovers: {
            connect: initialApprovers.map((approver) => ({ id: approver.userId })),
          },
          participants: {
            connect: department.participants.map((participant) => ({ id: participant.id })),
          },
          recruiters: {
            connect: department.recruiters.map((recruiter) => ({ id: recruiter.id })),
          },
          requestStatusId: pendingStatus.id
        },
      });
      // add all approvers to the request
      await ctx.db.requestStageApprover.createMany({
        data: allStageApprovers.map((approver) => ({
          requestId: createdRequest.id,
          stageId: approver.stageId,
          userId: approver.userId,
        })),
      });
      // for each field, create a RequestFieldInRequest record
      await ctx.db.requestFieldInRequest.createMany({
        data: input.fields.map((field) => ({
          requestId: createdRequest.id,
          requestFieldId: field.requestFieldId,
          value: field.value,
        })),
      });
      // refetch the created request with all of the RequestFieldInRequest records
      return ctx.db.request.findUnique({
        where: { id: createdRequest.id },
        include: {
          fields: true
        }
      });
    }),
  update: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      fields: z.array(z.object({
        requestFieldId: z.number(),
        value: z.string(),
      })),
     }))
    .mutation(async ({ input, ctx }) => {
      // for each field, update the RequestFieldInRequest record
      const existingRequestFieldInRequests = await ctx.db.requestFieldInRequest.findMany({
        where: {
          requestId: input.id,
        },
        include: {
          requestField: true,
        }
      });
      const fieldsUpdated = [];
      for (const field of existingRequestFieldInRequests) {
        const matchingInputField = input.fields.find((inputField) => inputField.requestFieldId === field.requestFieldId);
        if (!matchingInputField) {
          throw new Error(`No matching input field found for request field with id ${field.requestFieldId}`);
        }
        if (field.value !== matchingInputField.value) {
          await ctx.db.requestFieldInRequest.update({
            where: {
              id: field.id,
            },
            data: {
              value: matchingInputField.value,
            }
          });
          fieldsUpdated.push({
            id: field.id,
            name: existingRequestFieldInRequests.find((existingField) => existingField.id === field.id)?.requestField.name,
            fromValue: field.value,
            toValue: matchingInputField.value,
          });
        }
      }
      // emit an event that describes the fields that were updated
      await emitRequestEvent({
        props: {
          requestId: input.id,
          userId: ctx.session.user.id,
          action: "UPDATE",
          value: JSON.stringify(fieldsUpdated),
          ctx,
        }
      });
      // refetch the updated request with all of the RequestFieldInRequest records
      return ctx.db.request.findUnique({
        where: { id: input.id },
        include: {
          fields: true
        }
      });
    }),
  getAll: protectedProcedure
    .input(z.object({
      includeRequestType: z.boolean().optional().default(false),
      includeFields: z.boolean().optional().default(false),
      includeDepartment: z.boolean().optional().default(false),
      includeRequestStatus: z.boolean().optional().default(false),
      includeRequestEvents: z.boolean().optional().default(false),
      includeRequestStageApprovers: z.boolean().optional().default(false),
      includeParticipants: z.boolean().optional().default(false),
      includeRecruiters: z.boolean().optional().default(false),
      includeCreator: z.boolean().optional().default(false),
    }))
    .query(({ ctx, input }) => {
      return ctx.db.request.findMany({
        include: {
          requestType: input.includeRequestType,
          department: input.includeDepartment,
          fields: input.includeFields,
          status: input.includeRequestStatus,
          events: input.includeRequestEvents,
          stageApprovers: input.includeRequestStageApprovers,
          participants: input.includeParticipants,
          recruiters: input.includeRecruiters,
          creator: input.includeCreator,
        },
        ...(!ctx.session?.user?.isAdmin && {
          where: {
            // the user who made the query must be in the stageApprovers, creator, recruiter, participants, or admin
            OR: [
              {
                stageApprovers: {
                  some: {
                    userId: ctx.session.user.id,
                  }
                }
              },
              {
                creatorId: ctx.session.user.id,
              },
              {
                recruiters: {
                  some: {
                    id: ctx.session.user.id,
                  }
                }
              },
              {
                participants: {
                  some: {
                    id: ctx.session.user.id,
                  }
                }
              },
            ]
          },
        }),
        orderBy: { createdAt: "desc" },
      });
    }),
  getById: protectedProcedure
    .input(z.object({ 
      id: z.number(),
      includeRequestType: z.boolean().optional().default(true),
      includeFields: z.boolean().optional().default(true),
      includeRequestStatus: z.boolean().optional().default(true),
      includeRequestEvents: z.boolean().optional().default(true),
      includeRequestStageApprovers: z.boolean().optional().default(true),
      includeCurrentApprovers: z.boolean().optional().default(true),
      includeParticipants: z.boolean().optional().default(true),
      includeRecruiters: z.boolean().optional().default(true),
    }))
    .query(async ({ input, ctx }) => {
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          requestType: input.includeRequestType,
          fields: input.includeFields,
          status: input.includeRequestStatus,
          events: input.includeRequestEvents,
          stageApprovers: input.includeRequestStageApprovers,
          participants: input.includeParticipants,
          recruiters: input.includeRecruiters,
          currentApprovers: input.includeCurrentApprovers,
        }
      });
      // if the user isnt a recruiter, participant, stageApprover, creator, or is not an admin, throw an error
      const currentUserId = ctx.session.user.id;
      const isApprover = request.stageApprovers.find((approver) => approver.userId === currentUserId);
      const isParticipant = request.participants.find((participant) => participant.id === currentUserId);
      const isRecruiter = request.recruiters.find((recruiter) => recruiter.id === currentUserId);
      const isAdmin = ctx.session.user.isAdmin;
      if (!isApprover && !isParticipant && !isRecruiter && !isAdmin) {
        throw new Error("You are not authorized to view this request");
      }
      const requestFields = await ctx.db.requestFieldInRequest.findMany({
        where: {
          requestId: input.id,
        },
        include: {
          requestField: true,
        }
      });
      // for each field in the request.fields, find the corresponding field in the fields array and update the value to be the correct type
      const formatValue = (value: string, type: string) => {
        if (type === "NUMBER") {
          return Number(value);
        }
        if (type === "DATE") {
          return new Date(value);
        }
        return value;
      }
      const formattedFields = requestFields.map((field) => {
        return {
          ...field,
          value: formatValue(field.value, field.requestField.type),
        };
      });
      type RequestWithFormattedFields = typeof request & { 
        formattedFields: typeof formattedFields 
      } & {
        status: typeof request.status
      };
      const requestWithFormattedFields = {
        ...request,
        formattedFields,
      } as RequestWithFormattedFields;
      return requestWithFormattedFields;
    }),
  approve: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          requestType: true,
          fields: true,
          currentApprovers: true,
          creator: true,
          participants: true,
          recruiters: true,
          stageApprovers: true,
        }
      });
      // if the current user is not an approver for this request, throw an error
      const currentUserId = ctx.session.user.id;
      const isCurrentApprover = request.currentApprovers.find((approver) => approver.id === currentUserId);
      if (!isCurrentApprover) {
        throw new Error("You are not an approver for this stage of the request");
      }
      const currentStageInWorkflow = await ctx.db.stageInWorkflow.findUniqueOrThrow({
        where: {
          workflowId_stageId: {
            workflowId: request.requestType.workflowId,
            stageId: request.stageId,
          }
        }
      });
      const currentApprovers = await ctx.db.requestStageApprover.findMany({
        where: {
          requestId: request.id,
          stageId: currentStageInWorkflow.stageId,
        },
      });
      const nextStageInWorkflow = await ctx.db.stageInWorkflow.findUnique({
        where: {
          workflowId_order: {
            workflowId: request.requestType.workflowId,
            order: currentStageInWorkflow.order + 1,
          }
        },
        include: {
          stage: true,
        }
      });
      const stageApproverUsers = await ctx.db.user.findMany({
        where: {
          id: {
            in: request.stageApprovers.map((approver) => approver.userId),
          }
        }
      });
      const allUsersInvolved = [
        ...request.recruiters,
        ...request.participants,
        ...stageApproverUsers,
        request.creator,
      ];
      if (!nextStageInWorkflow) {
        // we have reached the end of the workflow, mark it as approved
        const approvedStatus = await ctx.db.requestStatus.findUniqueOrThrow({
          where: { name: "Approved" },
        });
        const updatedRequest = await ctx.db.request.update({
          where: {
            id: input.id,
          },
          data: {
            requestStatusId: approvedStatus.id,
            // disconnect all current approvers
            currentApprovers: {
              disconnect: currentApprovers.map((approver) => ({ id: approver.userId })),
            },
          }
        });
        await emitRequestEvent({
          props: {
            requestId: updatedRequest.id,
            userId: ctx.session.user.id,
            action: "APPROVE",
            value: request.stageId.toString(),
            ctx,
          }
        });
        const usersWithStatusChangedPreferenceOn = allUsersInvolved.filter((user) => 
          user.emailWhenRequestStageChanged
        );
        await sendEmail({
          props: {
            to: usersWithStatusChangedPreferenceOn.map((user) => user.email).filter(Boolean) as string[],
            subject: `REQ-${request.id} has been approved`,
            body: `
              REQ-${request.id} request has been approved by ${ctx.session.user.name}
              <br />
              View here: ${process.env.NEXTAUTH_URL}/request/${request.id}
            `,
            ctx,
          }
        });
        return updatedRequest;
      }
      const nextApprovers = await ctx.db.requestStageApprover.findMany({
        where: {
          requestId: request.id,
          stageId: nextStageInWorkflow.stageId,
        },
        include: {
          user: true,
        }
      });
      if (nextApprovers.length === 0) {
        throw new Error("No approvers found for this request");
      }
      const updatedRequest = await ctx.db.request.update({
        where: {
          id: input.id,
        },
        data: {
          stageId: nextStageInWorkflow.stageId,
          currentApprovers: {
            disconnect: currentApprovers.map((approver) => ({ id: approver.userId })),
            connect: nextApprovers.map((approver) => ({ id: approver.userId })),
          },
        }
      });
      await emitRequestEvent({
        props: {
          requestId: updatedRequest.id,
          userId: ctx.session.user.id,
          action: "APPROVE",
          value: request.stageId.toString(),
          ctx,
        }
      });
      // users who choose to be emailed for any stage change
      const usersWithStatusChangedPreferenceOn = allUsersInvolved.filter((user) => 
        user.emailWhenRequestStageChanged
      );
      // users who choose to be emailed when they are required to approve
      const nextApproversWithAwaitingMyApprovalPreferenceOn = nextApprovers.filter((approver) =>
        approver.user.emailWhenAwaitingMyRequestApproval
      );
      // make one array of unique emails based on the preferences of the users
      const emailsToSend = [...new Set<string>([
        ...usersWithStatusChangedPreferenceOn.map((user) => user.email).filter(Boolean),
        ...nextApproversWithAwaitingMyApprovalPreferenceOn.map((approver) => approver.user.email).filter(Boolean),
      ] as string[])];
      await sendEmail({
        props: {
          to: emailsToSend,
          subject: `REQ-${request.id} has moved to ${nextStageInWorkflow.stage.name}`,
          body: `REQ-${request.id} request has been moved to ${nextStageInWorkflow.stage.name} by ${ctx.session.user.name}`,
          ctx,
        }
      });
      return updatedRequest;
    }),
  reject: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          requestType: true,
          fields: true,
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
      // if the current user is not an approver for this request at some point in the workflow, throw an error
      const currentUserId = ctx.session.user.id;
      const isApproverInWorkflow = allStageApprovers.find((approver) => approver.userId === currentUserId);
      if (!isApproverInWorkflow) {
        throw new Error("You are not an approver for this stage of the request");
      }
      const rejectedStatus = await ctx.db.requestStatus.findUniqueOrThrow({
        where: { name: "Rejected" },
      });
      const updatedRequest = await ctx.db.request.update({
        where: {
          id: input.id,
        },
        data: {
          requestStatusId: rejectedStatus.id,
          // disconnect all approvers
          currentApprovers: {
            disconnect: allStageApprovers.map((approver) => ({ id: approver.userId })),
          }
        }
      });
      await emitRequestEvent({
        props: {
          requestId: updatedRequest.id,
          userId: ctx.session.user.id,
          action: "REJECT",
          value: request.stageId.toString(),
          ctx,
        }
      });
      const allUsersInvolved = [
        ...request.recruiters,
        ...request.participants,
        ...allStageApprovers.map((approver) => approver.user),
        request.creator,
      ];
      // users who choose to be emailed for any stage change
      const usersWithStatusChangedPreferenceOn = allUsersInvolved.filter((user) => 
        user.emailWhenRequestStageChanged
      );
      // make one array of unique emails based on the preferences of the users
      const emailsToSend = [...new Set<string>([
        ...usersWithStatusChangedPreferenceOn.map((user) => user.email).filter(Boolean),
      ] as string[])];
      await sendEmail({
        props: {
          to: emailsToSend,
          subject: `REQ-${request.id} is rejected`,
          body: `
            REQ-${request.id} request has been rejected by ${ctx.session.user.name}
            <br />
            View here: ${process.env.NEXTAUTH_URL}/request/${request.id}
          `,
          ctx,
        }
      });
      return updatedRequest;
    }),
  reopen: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          requestType: true,
          fields: true,
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
      // if the current user is not an approver for this request at some point in the workflow, throw an error
      const currentUserId = ctx.session.user.id;
      const isApproverInWorkflow = allStageApprovers.find((approver) => approver.userId === currentUserId);
      if (!isApproverInWorkflow) {
        throw new Error("You are not an approver for this stage of the request");
      }
      // get the first stage of the workflow
      const workflow = await ctx.db.workflow.findUniqueOrThrow({
        where: { id: request.requestType.workflowId },
      });
      const firstStageOfWorkflow = await ctx.db.stageInWorkflow.findFirstOrThrow({
        where: { workflowId: workflow.id },
        include: { stage: true },
        orderBy: { order: "asc" },
      });
      const firstStageRequestApprovers = await ctx.db.requestStageApprover.findMany({
        where: {
          requestId: request.id,
          stageId: firstStageOfWorkflow.stageId,
        },
      });
      const pendingStatus = await ctx.db.requestStatus.findUniqueOrThrow({
        where: { name: "Pending" },
      });
      const updatedRequest = await ctx.db.request.update({
        where: {
          id: input.id,
        },
        data: {
          stageId: firstStageOfWorkflow.stageId,
          requestStatusId: pendingStatus.id,
          currentApprovers: {
            // connect all of the approvers for the first stage of the workflow
            connect: firstStageRequestApprovers.map((approver) => ({ id: approver.userId })),
          }
        }
      });
      await emitRequestEvent({
        props: {
          requestId: updatedRequest.id,
          userId: ctx.session.user.id,
          action: "REOPEN",
          value: request.stageId.toString(),
          ctx,
        }
      });
      const allUsersInvolved = [
        ...request.recruiters,
        ...request.participants,
        ...allStageApprovers.map((approver) => approver.user),
        request.creator,
      ];
      // users who choose to be emailed for any stage change
      const usersWithStatusChangedPreferenceOn = allUsersInvolved.filter((user) => 
        user.emailWhenRequestStageChanged
      );
      // make one array of unique emails based on the preferences of the users
      const emailsToSend = [...new Set<string>([
        ...usersWithStatusChangedPreferenceOn.map((user) => user.email).filter(Boolean),
      ] as string[])];
      await sendEmail({
        props: {
          to: emailsToSend,
          subject: `REQ-${request.id} is reopened`,
          body: `
            REQ-${request.id} request has been reopened by ${ctx.session.user.name}
            <br />
            View here: ${process.env.NEXTAUTH_URL}/request/${request.id}
          `,
          ctx,
        }
      });
      return updatedRequest;
    }),
  removeApprover: adminProcedure
    .input(z.object({
      requestId: z.number(),
      requestStageApproverId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.requestId },
        include: { stageApprovers: true }
      });
      const requestStageApproverToDelete = request.stageApprovers.find(
        (approver) => approver.id === input.requestStageApproverId
      );
      if (!requestStageApproverToDelete) {
        throw new Error("Approver not found on request");
      };
      // you cannot delete the requestStageApproverId if there are no other requestStageApprovers for this request with the same stageId
      const otherRequestStageApproversAtThisStage = request.stageApprovers.filter(
        (approver) =>
          approver.stageId === requestStageApproverToDelete.stageId && // same stage id
          approver.id !== requestStageApproverToDelete.id // but not the approver we delete
      );
      if (!otherRequestStageApproversAtThisStage.length) {
        throw new Error("You must add an approver for this stage before removing the last approver.");
      };
      // if the currentApprovers on the request includes this user, disconnect them
      const requestWithCurrentApprovers = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.requestId },
        include: { currentApprovers: true }
      });
      const currentApproverToDelete = requestWithCurrentApprovers.currentApprovers.find(
        (approver) => approver.id === requestStageApproverToDelete.userId
      );
      if (currentApproverToDelete) {
        await ctx.db.request.update({
          where: { id: input.requestId },
          data: {
            currentApprovers: {
              disconnect: { id: currentApproverToDelete.id },
            },
          },
        });
      }
      // delete the requestStageApprover
      const deletedApprover = await ctx.db.requestStageApprover.delete({
        where: { id: input.requestStageApproverId },
      });
      return deletedApprover;
    }),
  addApprover: adminProcedure
    .input(z.object({
      requestId: z.number(),
      stageId: z.number(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === "") {
        throw new Error("User ID is required");
      }
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.requestId },
        include: { stageApprovers: true }
      });
      const existingApprover = request.stageApprovers.find(
        (approver) => approver.stageId === input.stageId && approver.userId === input.userId
      );
      if (existingApprover) {
        throw new Error("Approver already exists for this stage");
      };
      // add the approver
      const approverAdded = await ctx.db.requestStageApprover.create({
        data: {
          requestId: input.requestId,
          stageId: input.stageId,
          userId: input.userId,
        },
      });
      console.log({ reqstageid: request.stageId, inputstageid: input.stageId, approverAdded })
      // if the current stage of the request is the same as the stage we are adding an approver for, add the approver to the current approvers
      if (request.stageId === input.stageId) {
        console.log('updating request')
        const updated = await ctx.db.request.update({
          where: { id: input.requestId },
          data: {
            currentApprovers: {
              connect: { id: approverAdded.userId },
            },
          },
        });
        console.log({ updated })
      }
      return approverAdded;
    }),
  addParticipant: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.requestId },
        include: { 
          participants: true,
          recruiters: true,
          stageApprovers: true,
        }
      });
      // ensure that the user making this request is an approver, participant, or recruiter for this request
      const currentUserId = ctx.session.user.id;
      const isApprover = request.stageApprovers.find((approver) => approver.userId === currentUserId);
      const isParticipant = request.participants.find((participant) => participant.id === currentUserId);
      const isRecruiter = request.recruiters.find((recruiter) => recruiter.id === currentUserId);
      const isAdmin = ctx.session.user.isAdmin;
      if (!isApprover && !isParticipant && !isRecruiter && !isAdmin) {
        throw new Error("You are not authorized to remove participants from this request");
      }
      const existingParticipant = request.participants.find(
        (participant) => participant.id === input.userId
      );
      if (existingParticipant) {
        throw new Error("Participant already exists for this request");
      };
      // add the participant
      return await ctx.db.request.update({
        where: { id: input.requestId },
        data: {
          participants: {
            connect: { id: input.userId },
          },
        },
      });
    }),
  removeParticipant: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.requestId },
        include: { 
          participants: true,
          recruiters: true,
          stageApprovers: true,
        }
      });
      // ensure that the user making this request is an approver, participant, or recruiter for this request
      const currentUserId = ctx.session.user.id;
      const isApprover = request.stageApprovers.find((approver) => approver.userId === currentUserId);
      const isParticipant = request.participants.find((participant) => participant.id === currentUserId);
      const isRecruiter = request.recruiters.find((recruiter) => recruiter.id === currentUserId);
      const isAdmin = ctx.session.user.isAdmin;
      if (!isApprover && !isParticipant && !isRecruiter && !isAdmin) {
        throw new Error("You are not authorized to remove participants from this request");
      }
      const existingParticipant = request.participants.find(
        (participant) => participant.id === input.userId
      );
      if (!existingParticipant) {
        throw new Error("Participant does not exist for this request");
      };
      // remove the participant
      return await ctx.db.request.update({
        where: { id: input.requestId },
        data: {
          participants: {
            disconnect: { id: input.userId },
          },
        },
      });
    }),
  addRecruiter: adminProcedure
    .input(z.object({
      requestId: z.number(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.requestId },
        include: { recruiters: true }
      });
      const existingRecruiter = request.recruiters.find(
        (recruiter) => recruiter.id === input.userId
      );
      if (existingRecruiter) {
        throw new Error("Recruiter already exists for this request");
      };
      // add the recruiter
      return await ctx.db.request.update({
        where: { id: input.requestId },
        data: {
          recruiters: {
            connect: { id: input.userId },
          },
        },
      });
    }),
  removeRecruiter: adminProcedure
    .input(z.object({
      requestId: z.number(),
      userId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const request = await ctx.db.request.findUniqueOrThrow({
        where: { id: input.requestId },
        include: { recruiters: true }
      });
      const existingRecruiter = request.recruiters.find(
        (recruiter) => recruiter.id === input.userId
      );
      if (!existingRecruiter) {
        throw new Error("recruiter does not exist for this request");
      };
      // remove the recruiter
      return await ctx.db.request.update({
        where: { id: input.requestId },
        data: {
          recruiters: {
            disconnect: { id: input.userId },
          },
        },
      });
    }),
});
