import twilio from 'twilio';

/**
 * Sends a reminder notification to a customer.
 * Supports Twilio SMS and Twilio WhatsApp channels.
 * Fallbacks to console simulation when Twilio credentials are not configured in .env
 */
export const sendNotification = async ({ phone, name, amount, channel, shopName }) => {
  const messageBody = `Hello ${name}, your pending udhaar amount at ${shopName || 'our store'} is ₹${amount}. Kindly pay at your convenience.`;
  
  // Format phone to E.164 standard. If no country code is present, default to India (+91)
  let formattedPhone = phone.trim();
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${formattedPhone}`;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const twilioWhatsAppPhone = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number by default

  // Check if Twilio is configured
  if (!accountSid || !authToken || (!twilioPhone && channel === 'sms')) {
    console.log('\n=============================================');
    console.log('🔔 [TWILIO REMINDER SIMULATOR]');
    console.log(`Channel: ${channel.toUpperCase()}`);
    console.log(`Recipient Name: ${name}`);
    console.log(`Phone Number: ${formattedPhone}`);
    console.log(`Message Body: "${messageBody}"`);
    console.log('=============================================\n');

    return {
      success: true,
      simulated: true,
      sid: `SM_sim_${Math.random().toString(36).substring(2, 15)}`,
      message: messageBody,
    };
  }

  try {
    const client = twilio(accountSid, authToken);

    if (channel === 'whatsapp') {
      const fromNumber = twilioWhatsAppPhone.startsWith('whatsapp:') 
        ? twilioWhatsAppPhone 
        : `whatsapp:${twilioWhatsAppPhone}`;
      const toNumber = formattedPhone.startsWith('whatsapp:') 
        ? formattedPhone 
        : `whatsapp:${formattedPhone}`;

      const response = await client.messages.create({
        body: messageBody,
        from: fromNumber,
        to: toNumber,
      });

      return {
        success: true,
        simulated: false,
        sid: response.sid,
        message: messageBody,
      };
    } else {
      // SMS dispatch
      const response = await client.messages.create({
        body: messageBody,
        from: twilioPhone,
        to: formattedPhone,
      });

      return {
        success: true,
        simulated: false,
        sid: response.sid,
        message: messageBody,
      };
    }
  } catch (error) {
    console.error(`Twilio Error dispatching ${channel}: ${error.message}`);
    throw new Error(`Failed to send reminder via Twilio: ${error.message}`);
  }
};
