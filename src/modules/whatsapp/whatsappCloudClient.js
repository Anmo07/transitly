const https = require('https');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v20.0';

/**
 * WhatsApp Business Cloud API Client
 * Manages official Meta WhatsApp Cloud API communication, authentication,
 * interactive button messages, and template dispatches.
 */
class WhatsAppCloudClient {
  constructor(config = {}) {
    this.phoneNumberId = config.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = config.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
    this.apiVersion = config.apiVersion || 'v20.0';
    this.enabled = process.env.WHATSAPP_ENABLED === 'true';
  }

  /**
   * Internal HTTPS request dispatcher for Meta Graph API
   */
  async _sendMetaRequest(payload) {
    if (!this.enabled || !this.phoneNumberId || !this.accessToken) {
      console.log('[WhatsApp Cloud Client (Simulation Mode)] Payload dispatched:', JSON.stringify(payload, null, 2));
      return {
        messaging_product: 'whatsapp',
        contacts: [{ input: payload.to, wa_id: payload.to.replace(/\D/g, '') }],
        messages: [{ id: `wamid.SIMULATED_${Date.now()}_${Math.random().toString(36).substring(7)}` }]
      };
    }

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      const options = {
        hostname: 'graph.facebook.com',
        port: 443,
        path: `/${this.apiVersion}/${this.phoneNumberId}/messages`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`Meta WhatsApp API Error (${res.statusCode}): ${JSON.stringify(parsed)}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse Meta WhatsApp response: ${body}`));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(postData);
      req.end();
    });
  }

  /**
   * Sends an automated WhatsApp text message
   * @param {string} to E.164 phone number
   * @param {string} text Message body
   */
  async sendTextMessage(to, text) {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'text',
      text: {
        preview_url: false,
        body: text
      }
    };
    return this._sendMetaRequest(payload);
  }

  /**
   * Sends an interactive message with Quick-Reply action buttons
   * @param {string} to E.164 phone number
   * @param {string} bodyText
   * @param {Array<{id: string, title: string}>} buttons Max 3 buttons per Meta spec
   */
  async sendQuickReplyButtons(to, bodyText, buttons) {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.slice(0, 3).map((btn) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title.substring(0, 20)
            }
          }))
        }
      }
    };
    return this._sendMetaRequest(payload);
  }

  /**
   * Sends an interactive List Menu message (e.g. for Haryana Roadways corridors)
   * @param {string} to E.164 phone number
   * @param {string} headerText
   * @param {string} bodyText
   * @param {string} buttonLabel
   * @param {Array<{title: string, rows: Array<{id: string, title: string, description: string}>}>} sections
   */
  async sendListMenu(to, headerText, bodyText, buttonLabel, sections) {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/\D/g, ''),
      type: 'interactive',
      interactive: {
        type: 'list',
        header: {
          type: 'text',
          text: headerText
        },
        body: {
          text: bodyText
        },
        action: {
          button: buttonLabel.substring(0, 20),
          sections: sections
        }
      }
    };
    return this._sendMetaRequest(payload);
  }
}

module.exports = {
  WhatsAppCloudClient,
  whatsappCloudClient: new WhatsAppCloudClient()
};
