import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey = process.env.BREVO_API_KEY;

  async sendWelcomeEmail(to: string, senha: string, loginLink: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.error('BREVO_API_KEY não configurada. E-mail ignorado.');
      return;
    }

    // Endpoint da API v3 do Brevo (Funciona na porta 443, liberada no Render)
    const url = 'https://api.brevo.com/v3/smtp/email';

    const body = {
      sender: { name: 'AllRev Admin', email: 'rebecanonato89@gmail.com' }, // OBRIGATÓRIO: Seu email validado no Brevo
      to: [{ email: to }],
      subject: 'Acesso ao AllRev',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
          <h2>Bem-vindo ao AllRev!</h2>
          <p>Sua conta foi criada com sucesso.</p>
          <hr/>
          <p><strong>Login:</strong> ${to}</p>
          <p><strong>Senha temporária:</strong> ${senha}</p>
          <br/>
          <p>
            <a href="${loginLink}" style="background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Acessar Sistema
            </a>
          </p>
          <hr/>
          <p style="font-size: 12px; color: #999;">Mensagem automática (Brevo API).</p>
        </div>
      `,
    };

    try {
      this.logger.log(`[Brevo] Enviando para ${to}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro API Brevo: ${JSON.stringify(errorData)}`);
      }

      this.logger.log(`[Brevo] Sucesso! Email enviado para ${to}`);
    } catch (error: any) {
      this.logger.error(`[Brevo] Falha ao enviar: ${error.message}`);
      throw error; // AGORA SIM: Lança o erro para o UserService saber que falhou
    }
  }
}
