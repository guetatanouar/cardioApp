import sgMail from '@sendgrid/mail';
import validator from 'email-validator';
class EmailService {
    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.sgMail = sgMail;
    }
    async sendEmail(emailData) {
        try {
            if (!emailData.to && !emailData.bcc) {
                throw new Error('Au moins un destinataire (to ou bcc) est requis');
            }
            const validateEmails = (emails) => {
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
            const content = [
                ...(emailData.text ? [{ type: 'text/plain', value: emailData.text }] : []),
                ...(emailData.html ? [{ type: 'text/html', value: emailData.html }] : [])
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
                content: content,
                trackingSettings: {
                    clickTracking: { enable: false, enableText: false }
                }
            };
            const response = await this.sgMail.send(msg);
            return response;
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error.response?.body || error);
            throw error;
        }
    }
    formatRecipients(emails) {
        if (!emails)
            return [];
        return (Array.isArray(emails) ? emails : [emails]).map(email => ({ email }));
    }
}
export default new EmailService();
