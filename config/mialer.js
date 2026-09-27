const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Plantilla 1: Correo de Bienvenida
exports.sendWelcomeEmail = async (toEmail, pairId, user1, user2) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #FAF9F6; padding: 20px; color: #4A6B82;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; border: 1px solid #EDF2F7;">
        <h2 style="color: #7EA172; text-align: center; margin-bottom: 5px;">¡Bienvenidos a My Roomie! ❤️</h2>
        <p style="text-align: center; color: #718096; font-size: 14px;">Gestión Financiera Colaborativa</p>
        <hr style="border: none; border-top: 1px solid #EDF2F7; margin: 20px 0;">
        <p>Hola <strong>${user1}</strong> y <strong>${user2}</strong>,</p>
        <p>Su espacio de pareja ha sido registrado exitosamente. Ya pueden comenzar a gestionar sus ingresos, gastos compartidos, listas de mercado y planes de créditos en equipo.</p>
        <div style="background-color: #F4F7F4; padding: 15px; border-radius: 12px; margin: 20px 0; text-align: center;">
          <span style="font-size: 12px; color: #718096; display: block;">Su ID de Pareja:</span>
          <strong style="font-size: 18px; color: #4A6B82;">${pairId}</strong>
        </div>
        <p style="font-size: 13px; color: #718096; text-align: center;">Gracias por confiar en My Roomie para hacer sus finanzas en pareja más sencillas y transparentes.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"My Roomie" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '¡Bienvenidos a My Roomie! 🏠✨',
    html: htmlContent
  });
};

// Plantilla 2: Recuperación de Contraseña
exports.sendResetPasswordEmail = async (toEmail, pairId, resetToken) => {
  const resetLink = `https://my-rommie.onrender.com/reset-password.html?token=${resetToken}&pairId=${pairId}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #FAF9F6; padding: 20px; color: #4A6B82;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 30px; border: 1px solid #EDF2F7;">
        <h2 style="color: #E07A5F; text-align: center;">Recuperación de Contraseña 🔑</h2>
        <p>Recibimos una solicitud para restablecer la contraseña del espacio de pareja <strong>${pairId}</strong>.</p>
        <p>Haz clic en el siguiente botón para definir una nueva contraseña (este enlace expira en 1 hora):</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #7EA172; color: white; padding: 12px 25px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block;">Restablecer Mi Contraseña</a>
        </div>
        <p style="font-size: 12px; color: #A0AEC0;">Si no solicitaste este cambio, puedes ignorar este correo de manera segura.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    from: `"My Roomie Soporte" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Recuperación de Contraseña - My Roomie 🔑',
    html: htmlContent
  });
};