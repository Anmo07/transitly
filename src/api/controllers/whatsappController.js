const whatsappService = require('../../modules/whatsapp/whatsappService');

/**
 * WhatsApp Conversational Assistant Controller
 */
class WhatsAppController {
  /**
   * Meta Webhook Verification Endpoint (GET /api/v1/whatsapp/webhook)
   */
  async verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const result = whatsappService.verifyWebhookChallenge(mode, token, challenge);
    if (result.success) {
      console.log('[WhatsApp Webhook] Meta Webhook verified successfully.');
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ status: 'error', message: 'Webhook verification failed: invalid token.' });
  }

  /**
   * Process Inbound Webhook / Message with Privacy Filter & Intent Parser (POST /api/v1/whatsapp/webhook)
   */
  async handleInbound(req, res) {
    try {
      // Support Meta Webhook payload structure or direct JSON
      let from = req.body.from;
      let messageText = req.body.messageText;

      if (req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const metaMsg = req.body.entry[0].changes[0].value.messages[0];
        from = metaMsg.from;
        messageText = metaMsg.text?.body || metaMsg.interactive?.button_reply?.title || metaMsg.interactive?.list_reply?.title || '';
      }

      if (!from || !messageText) {
        return res.status(400).json({ status: 'error', message: 'Fields "from" and "messageText" are required.' });
      }

      const result = await whatsappService.handleInboundMessage({ from, messageText });
      return res.status(200).json({
        status: 'success',
        data: {
          to: from,
          reply: result.replyText || result
        }
      });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  /**
   * Dispatch Outbound Notification Template (POST /api/v1/whatsapp/send)
   */
  async sendNotification(req, res) {
    try {
      const { to, templateType, data } = req.body;
      const result = await whatsappService.sendTemplateMessage(to, templateType, data);
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  }
}

module.exports = new WhatsAppController();
