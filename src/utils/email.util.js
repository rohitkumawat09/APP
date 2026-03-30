import { Resend } from "resend";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";

const resend = new Resend(env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, text }) => {
  try {
    const response = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html: `<p>${text}</p>`,
    });

    if (response.error) {
      logger.error(
        `Resend Email Error | to: ${to} | subject: ${subject} | error: ${JSON.stringify(response.error)}`,
      );
      return {
        success: false,
        error: response.error.message,
      };
    }

    logger.info(`Email sent successfully to ${to} | subject: ${subject}`);

    return {
      success: true,
      response,
    };
  } catch (error) {
    logger.error(
      `Resend Email Error | to: ${to} | subject: ${subject} | error: ${error?.message}`,
    );

    return {
      success: false,
      error: error.message,
    };
  }
};
