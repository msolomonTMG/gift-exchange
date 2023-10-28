import { type Prisma, type PrismaClient } from "@prisma/client";
import { type DefaultArgs } from "@prisma/client/runtime/library";
import { type Session } from "next-auth";
import { appRouter } from "~/server/api/root";

type EmitEventProps = {
  requestId: number;
  userId: string;
  action: string;
  value: string;
  ctx: {
    session: Session | null;
    db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
  };
}
export const emitRequestEvent = async ({ props } : { props: EmitEventProps }) => {
  const caller = appRouter.createCaller(props.ctx);
  await caller.requestEvent.create({
    requestId: props.requestId,
    userId: props.userId,
    action: props.action,
    value: props.value,
  });
};

export default emitRequestEvent;