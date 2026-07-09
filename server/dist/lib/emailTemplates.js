const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
export const emailTemplates = {
    welcomePatientClient: (firstName, username, password) => `
    <h3>Bonjour ${firstName},</h3>
    <p>Bienvenue ! Votre compte patient a été créé avec succès.</p>
    <p>Voici vos identifiants de connexion :</p>
    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Identifiant :</strong> ${username}</p>
      <p style="margin: 5px 0;"><strong>Mot de passe :</strong> ${password}</p>
    </div>
    <p>Connectez-vous dès maintenant sur <a href="${baseUrl}">${baseUrl}</a> pour accéder à votre espace patient.</p>
    <p>Nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
  `,
    welcomePatientAdmin: (firstName, lastName, email, username) => `
    <h3>Nouveau patient créé</h3>
    <p>Un nouveau patient a été créé sur la plateforme :</p>
    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Nom :</strong> ${firstName} ${lastName}</p>
      <p style="margin: 5px 0;"><strong>Email :</strong> ${email || 'Non renseigné'}</p>
      <p style="margin: 5px 0;"><strong>Identifiant :</strong> ${username}</p>
    </div>
    <p>Les identifiants de connexion ont été envoyés au patient par email.</p>
  `
};
