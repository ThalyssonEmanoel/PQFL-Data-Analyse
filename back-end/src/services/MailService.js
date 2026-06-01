import { getTransporter, mailConfig } from "../config/mailer.js";
import { registerProcessor, enqueue } from "./JobQueue.js";
import logger from "../config/logger.js";
import { maskEmail } from "../utils/cryptoTokens.js";

const QUEUE = "email";

const frontUrl = () => (process.env.FRONT_URL || "http://localhost:5173").replace(/\/$/, "");
const apiUrl = () =>
  (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 8080}`).replace(/\/$/, "");

// Layout HTML minimo e consistente para todos os e-mails transacionais.
const wrap = (title, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#222">
    <h2 style="color:#1a6e3c">PQFL</h2>
    <h3>${title}</h3>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="font-size:12px;color:#888">Plano de Qualificacao de Fornecedores de Leite. Este e um e-mail automatico — nao responda.</p>
  </div>`;

// Processor: faz o envio de fato. Roda inline (sem Redis) ou no worker (com Redis).
const sendNow = async ({ data }) => {
  const transporter = getTransporter();
  const info = await transporter.sendMail({ from: mailConfig.from, ...data });

  if (mailConfig.isConsole) {
    // Em dev, logamos o conteudo para que o link/token seja testavel sem SMTP real.
    logger.info(
      { to: maskEmail(data.to), subject: data.subject, body: info.message?.toString?.() },
      "E-mail (modo console) — NAO enviado, apenas exibido"
    );
  } else {
    logger.info({ to: maskEmail(data.to), subject: data.subject, messageId: info.messageId }, "E-mail enviado");
  }
  return info;
};

registerProcessor(QUEUE, sendNow);

// Servico de e-mail: cada metodo monta o conteudo e ENFILEIRA (nao bloqueia a resposta).
class MailService {
  static enqueue(mail) {
    return enqueue(QUEUE, "send", mail);
  }

  // Primeiro acesso (apos cadastro pelo admin): usuario define a senha via fluxo de reset.
  static async sendFirstAccessEmail({ to, token }) {
    const link = `${frontUrl()}/reset-password?token=${token}&first=1`;
    return MailService.enqueue({
      to,
      subject: "Bem-vindo ao PQFL — defina sua senha",
      text: `Sua conta foi criada. Defina sua senha de primeiro acesso (expira em 30 min): ${link}`,
      html: wrap(
        "Defina sua senha de primeiro acesso",
        `<p>Uma conta foi criada para voce no PQFL. Clique no botao abaixo para definir sua senha (o link expira em 30 minutos):</p>
         <p><a href="${link}" style="background:#1a6e3c;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Definir senha</a></p>
         <p style="font-size:12px;color:#888">Se voce nao esperava este e-mail, ignore-o.</p>`
      ),
    });
  }

  // Confirmacao de e-mail — link aponta para o endpoint GET do back-end.
  static async sendConfirmationEmail({ to, token }) {
    const link = `${apiUrl()}/auth/confirmEmail?token=${token}`;
    return MailService.enqueue({
      to,
      subject: "Confirme seu e-mail — PQFL",
      text: `Confirme seu e-mail (expira em 24h): ${link}`,
      html: wrap(
        "Confirme seu e-mail",
        `<p>Confirme seu endereco de e-mail para ativar o acesso (o link expira em 24 horas):</p>
         <p><a href="${link}" style="background:#1a6e3c;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Confirmar e-mail</a></p>`
      ),
    });
  }

  // Reset de senha solicitado pelo usuario.
  static async sendPasswordResetEmail({ to, token }) {
    const link = `${frontUrl()}/reset-password?token=${token}`;
    return MailService.enqueue({
      to,
      subject: "Redefinicao de senha — PQFL",
      text: `Redefina sua senha (expira em 30 min): ${link}`,
      html: wrap(
        "Redefinir senha",
        `<p>Recebemos um pedido para redefinir sua senha. Clique abaixo (o link expira em 30 minutos):</p>
         <p><a href="${link}" style="background:#1a6e3c;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Redefinir senha</a></p>
         <p style="font-size:12px;color:#888">Se nao foi voce, ignore este e-mail — sua senha continua a mesma.</p>`
      ),
    });
  }

  // Aviso pos-troca de senha (seguranca).
  static async sendPasswordChangedNotice({ to }) {
    return MailService.enqueue({
      to,
      subject: "Sua senha foi alterada — PQFL",
      text: "Sua senha foi alterada. Se nao foi voce, contate o administrador imediatamente.",
      html: wrap(
        "Sua senha foi alterada",
        `<p>Sua senha do PQFL foi alterada com sucesso.</p>
         <p><strong>Nao foi voce?</strong> Contate o administrador do sistema imediatamente.</p>`
      ),
    });
  }
}

export default MailService;
