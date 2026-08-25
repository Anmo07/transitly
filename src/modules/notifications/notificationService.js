/**
 * Notifications Domain Service
 * Handles multi-channel event-driven customer communications (SMS, Email, Push).
 */
class NotificationService {
  constructor() {
    this.dispatchedNotifications = [];
  }

  /**
   * Dispatches customer notification based on domain event.
   * @param {Object} eventEnvelope 
   */
  async handleEvent(eventEnvelope) {
    const { eventType, payload, correlationId } = eventEnvelope;
    const notification = {
      notificationId: `NOTIF-${Date.now()}`,
      eventType,
      recipient: payload.recipient?.phone || payload.recipient?.email || 'N/A',
      correlationId,
      dispatchedAt: new Date(),
      status: 'SENT'
    };

    this.dispatchedNotifications.push(notification);
    return notification;
  }

  getDispatchedHistory() {
    return this.dispatchedNotifications;
  }
}

module.exports = new NotificationService();
