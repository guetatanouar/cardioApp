import sgMail from '@sendgrid/mail';
import validator from 'email-validator';

interface EmailData {
  to?: string | string[];
  bcc?: string | string[];
  from: { email: string; name: string };
  subject: string;
  html?: string;
  text?: string;
}

class EmailService {
  private sgMail: typeof sgMail;

  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
    this.sgMail = sgMail;
  }

  async sendEmail(emailData: EmailData) {
    try {
      if (!emailData.to && !emailData.bcc) {
        throw new Error('Au moins un destinataire (to ou bcc) est requis');
      }

      const validateEmails = (emails: string | string[]) => {
        const emailList = Array.isArray(emails) ? emails : [emails];
        return emailList.every(email => {
          const isValid = validator.validate(email);
          if (!isValid) {
            console.warn(`Adresse email invalide détectée: ${email}`);
          }
          return isValid;
        });
      };

      if (emailData.to && !validateEmails(emailData.to)) {
        throw new Error('Adresse email invalide dans "To"');
      }
      if (emailData.bcc && !validateEmails(emailData.bcc)) {
        throw new Error('Adresse email invalide dans "Bcc"');
      }

      if (!emailData.html && !emailData.text) {
        throw new Error('Au moins un contenu (html ou text) est requis');
      }

      const content: { type: 'text/plain' | 'text/html'; value: string }[] = [
        ...(emailData.text ? [{ type: 'text/plain' as const, value: emailData.text }] : []),
        ...(emailData.html ? [{ type: 'text/html' as const, value: emailData.html }] : [])
      ];

      if (!content.length) {
        content.push({ type: 'text/plain', value: ' ' });
      }

      const msg = {
        personalizations: [
          {
            to: this.formatRecipients(emailData.to),
            bcc: emailData.bcc ? this.formatRecipients(emailData.bcc) : undefined
          }
        ],
        from: {
          email: emailData.from.email,
          name: emailData.from.name
        },
        subject: emailData.subject,
        content: content as any,
        trackingSettings: {
          clickTracking: { enable: false, enableText: false }
        }
      };

      const response = await this.sgMail.send(msg);
      return response;
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email:', error.response?.body || error);
      throw error;
    }
  }

  private formatRecipients(emails?: string | string[]) {
    if (!emails) return [];
    return (Array.isArray(emails) ? emails : [emails]).map(email => ({ email }));
  }
}

export default new EmailService();
