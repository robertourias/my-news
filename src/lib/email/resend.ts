import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY não configurada");
    client = new Resend(apiKey);
  }
  return client;
}

/** Envia o código de 6 dígitos por email. Lança em caso de falha do Resend. */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const from = process.env.RESEND_FROM;
  if (!from) throw new Error("RESEND_FROM não configurada");

  const { error } = await getClient().emails.send({
    from,
    to: [to],
    subject: "Seu código de acesso",
    html: `<p>Seu código de acesso ao Briefing Diário é:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
<p>Expira em 10 minutos. Se você não pediu esse código, ignore este email.</p>`,
  });

  if (error) throw new Error(`Falha ao enviar e-mail: ${error.message}`);
}
