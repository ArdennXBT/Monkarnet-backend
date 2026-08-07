const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const envoyerCodeVerification = async (email, nomComplet, code) => {
  try {
    await resend.emails.send({
      from: 'Orbizo <noreply@orbizo.xyz>',
      to: email,
      subject: 'Votre code de vérification Orbizo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1E3A8A;">Bienvenue sur Orbizo, ${nomComplet} 👋</h2>
          <p>Voici votre code de vérification :</p>
          <div style="background: #F5F6F8; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1E3A8A;">${code}</span>
          </div>
          <p style="color: #666;">Ce code expire dans 15 minutes.</p>
          <p style="color: #999; font-size: 12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Erreur envoi email :', error.message);
    throw new Error("Impossible d'envoyer l'email de vérification.");
  }
};

module.exports = { envoyerCodeVerification };