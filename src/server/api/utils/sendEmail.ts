import { type Prisma, type PrismaClient } from "@prisma/client";
import { type DefaultArgs } from "@prisma/client/runtime/library";
import { type Session } from "next-auth";
import { appRouter } from "~/server/api/root";

type SendEmailProps = {
  to: string[];
  subject: string;
  body: string;
  ctx: {
    session: Session | null;
    db: PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>;
  };
};

export const sendEmail = async ({ props } : { props: SendEmailProps }) => {
  const caller = appRouter.createCaller(props.ctx);
  await caller.email.send({
    to: props.to,
    subject: props.subject,
    body: props.body,
  });
};

export default sendEmail;