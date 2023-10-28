import { type Prisma, type PrismaClient } from "@prisma/client";
import { type DefaultArgs } from "@prisma/client/runtime/library";
import { type Session } from "next-auth";
import { appRouter } from "~/server/api/root";

type EmitEventProps = {
  requestId: number;
  userId: string;
  ctx: {
    session: Session | null;
    db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
  };
}
export const isAllowedToViewRequest = async ({ props } : { props: EmitEventProps }) => {
  const caller = appRouter.createCaller(props.ctx);
  // fetch the request
  const request = await caller.request.getById({
    id: props.requestId,
    includeCurrentApprovers: true,
    includeRequestStageApprovers: true,
    includeParticipants: true,
    includeRecruiters: true,
  });
  // the userId passed in must be in the stageApprovers, currentApprovers, participants, recruiters, the creator, or an admin
  const userIsAllowedToViewRequest = [
    ...request.stageApprovers.map((approver) => approver.userId),
    ...request.currentApprovers.map((approver) => approver.id),
    ...request.participants.map((participant) => participant.id),
    ...request.recruiters.map((recruiter) => recruiter.id),
    request.creatorId,
  ].includes(props.userId);

  return userIsAllowedToViewRequest;
};

export default isAllowedToViewRequest;