import nodemailer from "nodemailer";
import logger from "./logger.js";

// Configuracao de e-mail. Em dev (ou sem SMTP_HOST) usa jsonTransport: os e-mails
// nao sao enviados, apenas montados e logados — util para testar os fluxos de
// confirmacao/reset sem um servidor SMTP. Em prod, configure SMTP_* (SES/SendGrid/etc).
const provider = (process.env.MAIL_PROVIDER || "console").toLowerCase();

export const mailConfig = {
  provider,
  from: process.env.MAIL_FROM || "PQFL <no-reply@pqfl.local>",
  // Modo "console" explicito OU smtp sem host configurado.
  isConsole: provider === "console" || (provider === "smtp" && !process.env.SMTP_HOST),
};

let transporter = null;

export const getTransporter = () => {
  if (transporter) return transporter;

  if (mailConfig.isConsole) {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    logger.warn(
      "MailService em modo 'console': e-mails NAO sao enviados, apenas registrados no log. Configure SMTP_* em producao."
    );
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  return transporter;
};

export default getTransporter;
