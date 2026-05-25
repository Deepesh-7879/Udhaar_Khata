import nodemailer from 'nodemailer';

/**
 * Sends an email reminder notification to a customer.
 * Fallbacks to console simulation when SMTP credentials are not configured in .env
 */
export const sendEmailNotification = async ({ email, name, amount, shopName, fromEmail, smtpSettings }) => {
  const cleanEmail = email ? email.trim() : '';
  const storeName = shopName || 'our store';
  const messageBody = `Hello ${name}, your pending udhaar amount at ${storeName} is ₹${amount}. Kindly pay at your convenience.`;

  const hasCustomSmtp = smtpSettings && smtpSettings.host && smtpSettings.user && smtpSettings.pass;

  const smtpHost = hasCustomSmtp ? smtpSettings.host : process.env.SMTP_HOST;
  const smtpPort = hasCustomSmtp ? smtpSettings.port : (process.env.SMTP_PORT || 587);
  const smtpUser = hasCustomSmtp ? smtpSettings.user : process.env.SMTP_USER;
  const smtpPass = hasCustomSmtp ? smtpSettings.pass : process.env.SMTP_PASS;
  const smtpFrom = hasCustomSmtp ? smtpSettings.user : (fromEmail || process.env.SMTP_FROM || smtpUser);

  // Check if SMTP is configured
  if (!smtpUser || !smtpPass) {
    console.log('\n=============================================');
    console.log('📧 [EMAIL REMINDER SIMULATOR]');
    console.log(`Recipient Name: ${name}`);
    console.log(`Recipient Email: ${cleanEmail || 'no-email@configured.com'}`);
    console.log(`From Email: ${smtpFrom}`);
    console.log(`Subject: Payment Reminder - ${storeName}`);
    console.log('---------------------------------------------');
    console.log(`Message Body:\n"${messageBody}"`);
    console.log('=============================================\n');

    return {
      success: true,
      simulated: true,
      sid: `EM_sim_${Math.random().toString(36).substring(2, 15)}`,
      message: messageBody,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost || 'smtp.gmail.com',
      port: parseInt(smtpPort.toString()),
      secure: smtpPort.toString() === '465', // true for 465, false for 587/other
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        // Bypass SSL/TLS certificate verification issues (common with local networks/antivirus SSL scanning)
        rejectUnauthorized: false
      }
    });

    let senderEmail;
    let senderDisplayName;

    if (hasCustomSmtp) {
      senderEmail = smtpUser;
      senderDisplayName = storeName;
    } else {
      senderEmail = (fromEmail && fromEmail.trim().toLowerCase() !== smtpUser.trim().toLowerCase()) ? smtpUser : smtpFrom;
      senderDisplayName = (fromEmail && fromEmail.trim().toLowerCase() !== smtpUser.trim().toLowerCase()) ? `${storeName} (${fromEmail})` : storeName;
    }

    const mailOptions = {
      from: `"${senderDisplayName}" <${senderEmail}>`,
      replyTo: fromEmail || smtpFrom,
      to: cleanEmail,
      subject: `Payment Reminder - ${storeName}`,
      text: messageBody,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f5f9; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; text-transform: uppercase;">${storeName}</h2>
            <span style="font-size: 12px; color: #6b7280; font-weight: bold;">DIGITAL UDHAAR LEDGER</span>
          </div>
          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 0;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            This is a friendly reminder regarding your outstanding balance with our store.
          </p>
          <div style="background-color: #fef2f2; border: 1px dashed #fca5a5; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <span style="font-size: 12px; color: #ef4444; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 4px;">Pending Amount Due</span>
            <span style="font-size: 28px; color: #b91c1c; font-weight: 900;">₹${amount.toLocaleString('en-IN')}</span>
          </div>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            We kindly request you to clear this outstanding amount at your convenience. If you have already made the payment, please ignore this email.
          </p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-bottom: 0;">
            This is an automated payment alert sent by ${storeName} using Udhaar Khata ledger application.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      simulated: false,
      sid: info.messageId,
      message: messageBody,
    };
  } catch (error) {
    console.error(`SMTP Error dispatching Email reminder: ${error.message}`);
    throw new Error(`Failed to send email reminder: ${error.message}`);
  }
};
