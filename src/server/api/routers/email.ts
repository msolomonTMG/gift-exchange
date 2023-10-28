import { Resend } from 'resend';
import { z } from "zod";

import EmailTemplate from "~/components/Email/Template";
import { APP_NAME } from '~/constants';
import { env } from '~/env.mjs';
import {
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";

const resend = new Resend(env.RESEND_API_KEY);

export const emailRouter = createTRPCRouter({
  send: publicProcedure
    .input(z.object({
      to: z.array(z.string()),
      subject: z.string(),
      body: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        await resend.emails.send({
          from: `${APP_NAME} <noreply@resend.dev>`,
          to: input.to,
          subject: input.subject,
          react: EmailTemplate({ text: input.body }),
          text: input.body,
        });
      } catch (error) {
        const e = error as Error;
        // try emailing with airtable as a fallback for when we reach resend limit (100 per day)
        try {
          await fetch(env.AIRTABLE_EMAIL_WEBHOOK, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              body: input.body,
              subject: input.subject,
              to: input.to.join(', '),
              password: env.AIRTABLE_EMAIL_PASSWORD,
            }),
          });
        } catch (e) {
          console.log('airtable email error', e);
          const airtableError = e as Error;
          throw new Error(`Error sending email: ${airtableError.message}`);
        }
        throw new Error(`Error sending email: ${e.message}`);
      }
    })
});