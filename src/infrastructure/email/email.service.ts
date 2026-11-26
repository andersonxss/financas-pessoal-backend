import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

export interface SendLinkEmail {
  to: string;
  subject: string;
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
}

@Injectable()
export class EmailService {
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get('SMTP_USER') && this.config.get('SMTP_PASSWORD'));
  }

  async sendLink(input: SendLinkEmail): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      await this.getTransporter().sendMail({
        from: this.config.get<string>('SMTP_FROM') ?? 'Finance Sistem <no-reply@finance.local>',
        to: input.to,
        subject: input.subject,
        text: `${input.title}\n\n${input.message}\n\n${input.actionLabel}: ${input.actionUrl}`,
        html: this.render(input),
      });
      return true;
    } catch {
      throw new ServiceUnavailableException('Não foi possível enviar o e-mail agora');
    }
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const port = Number(this.config.get('SMTP_PORT') ?? 2525);
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('SMTP_HOST') ?? 'sandbox.smtp.mailtrap.io',
        port,
        secure: port === 465,
        auth: {
          user: this.config.getOrThrow<string>('SMTP_USER'),
          pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
        },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
      });
    }
    return this.transporter;
  }

  private render(input: SendLinkEmail): string {
    const safe = (value: string) =>
      value.replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
      })[character] ?? character);
    const url = safe(input.actionUrl);
    return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#eef2f2;font-family:Arial,sans-serif;color:#1a1a1a"><div style="max-width:560px;margin:32px auto;background:#fff;border-radius:24px;padding:32px"><div style="display:inline-block;background:#d0f644;border-radius:999px;padding:8px 12px;font-weight:700">Finance Sistem</div><h1 style="font-size:24px;margin:28px 0 12px">${safe(input.title)}</h1><p style="line-height:1.6;color:#526066">${safe(input.message)}</p><a href="${url}" style="display:inline-block;margin-top:20px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:14px;padding:14px 20px;font-weight:700">${safe(input.actionLabel)}</a><p style="margin-top:28px;font-size:12px;color:#708087;word-break:break-all">${url}</p></div></body></html>`;
  }
}
