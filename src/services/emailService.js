const nodemailer = require('nodemailer');

const OFFICIAL_DEV_EMAIL = 'anmolrajotiya@gmail.com';

class EmailService {
  /**
   * Initialize secure Google Gmail Transporter
   */
  getTransporter() {
    const user = process.env.GMAIL_USER || process.env.SMTP_USER || OFFICIAL_DEV_EMAIL;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

    if (!pass) {
      return null;
    }

    return nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user,
        pass
      }
    });
  }

  /**
   * Send Emergency Master Admin Password Recovery Email via Google Gmail
   */
  async sendEmergencyAdminRecovery(ipAddress = '127.0.0.1', userAgent = 'Unknown') {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@transitlyproject';
    const timestamp = new Date().toUTCString();

    const subject = '🚨 [CRITICAL ALERT] Transitly Admin Credentials Emergency Recovery';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; color: #1a1c1e; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e1e3e5; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { display: flex; align-items: center; border-bottom: 2px solid #ea4335; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 700; color: #b3261e; margin: 0; }
          .card { background-color: #f2f4f6; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #dcdfe2; }
          .pwd-box { font-family: monospace; font-size: 18px; font-weight: bold; background: #1c1b1f; color: #70d8a5; padding: 12px 16px; border-radius: 8px; letter-spacing: 1px; display: inline-block; margin: 10px 0; }
          .meta-list { font-size: 12px; color: #444749; line-height: 1.6; }
          .footer { font-size: 11px; color: #747779; text-align: center; margin-top: 32px; border-top: 1px solid #e1e3e5; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="title">Transitly Command Center — Emergency Recovery</h2>
          </div>
          <p>Hello Lead Developer <strong>(Anmol)</strong>,</p>
          <p>An emergency credential recovery request was triggered for the <strong>Transitly Command Center Admin Terminal</strong>.</p>
          
          <div class="card">
            <div style="font-size: 13px; font-weight: 600; color: #1a1c1e;">Master Admin Access Credentials:</div>
            <div class="pwd-box">${adminPassword}</div>
            <p style="font-size: 12px; color: #444749; margin: 0;">Use this password to bypass biometric lockdown and regain full administrative clearance.</p>
          </div>

          <div style="margin-top: 20px;">
            <div style="font-size: 12px; font-weight: 600; color: #1a1c1e; margin-bottom: 6px;">Audit Security Context:</div>
            <div class="meta-list">
              • <strong>Timestamp:</strong> ${timestamp}<br>
              • <strong>Requesting IP:</strong> ${ipAddress}<br>
              • <strong>Client Agent:</strong> ${userAgent}<br>
              • <strong>Official Recipient:</strong> ${OFFICIAL_DEV_EMAIL}
            </div>
          </div>

          <div class="footer">
            Transitly Autonomous Dispatch & Telematics Platform • Google Gmail Security Gateway
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`\n======================================================`);
    console.log(`🚨 [GOOGLE GMAIL EMERGENCY DISPATCH TO ${OFFICIAL_DEV_EMAIL}]`);
    console.log(`Subject: ${subject}`);
    console.log(`Recipient: ${OFFICIAL_DEV_EMAIL}`);
    console.log(`Master Password: ${adminPassword}`);
    console.log(`Triggered from IP: ${ipAddress} at ${timestamp}`);
    console.log(`======================================================\n`);

    const transporter = this.getTransporter();
    if (!transporter) {
      return {
        success: true,
        recipient: OFFICIAL_DEV_EMAIL,
        deliveryMethod: 'GMAIL_PENDING_APP_PASSWORD',
        timestamp,
        note: 'Set GMAIL_APP_PASSWORD in .env for direct transmission via smtp.gmail.com'
      };
    }

    try {
      const sender = process.env.GMAIL_USER || OFFICIAL_DEV_EMAIL;
      const info = await transporter.sendMail({
        from: `"Transitly Security" <${sender}>`,
        to: OFFICIAL_DEV_EMAIL,
        subject,
        html
      });

      console.log(`✔ [Gmail Delivery Confirmed]: Message ID ${info.messageId}`);
      return {
        success: true,
        recipient: OFFICIAL_DEV_EMAIL,
        deliveryMethod: 'GOOGLE_GMAIL_SMTP',
        messageId: info.messageId,
        timestamp
      };
    } catch (err) {
      console.warn(`⚠ [Google Gmail SMTP Error]: ${err.message}`);
      throw new Error(`Google Gmail delivery failed: ${err.message}`);
    }
  }
}

module.exports = new EmailService();
