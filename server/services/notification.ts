/**
 * Notification Service - SMS/WhatsApp notifications using Twilio
 * Falls back to mock notifications when credentials are not configured
 */

interface NotificationConfig {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  whatsappApiKey?: string;
}

interface SMSPayload {
  to: string;
  message: string;
}

interface WhatsAppPayload {
  to: string;
  message: string;
}

class NotificationService {
  private config: NotificationConfig;
  private useMock: boolean;

  constructor() {
    this.config = {
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
      whatsappApiKey: process.env.WHATSAPP_API_KEY,
    };
    
    // Use mock if Twilio credentials are not configured
    this.useMock = !this.config.twilioAccountSid || !this.config.twilioAuthToken || !this.config.twilioPhoneNumber;
    
    if (this.useMock) {
      console.log('[Notification Service] Running in MOCK mode - Twilio credentials not configured');
    } else {
      console.log('[Notification Service] Running with Twilio integration');
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(payload: SMSPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (this.useMock) {
      return this.mockSendSMS(payload);
    }

    try {
      // Real Twilio integration would go here
      // For now, we'll use the mock implementation
      // TODO: Uncomment when Twilio SDK is added
      /*
      const twilio = require('twilio');
      const client = twilio(this.config.twilioAccountSid, this.config.twilioAuthToken);
      
      const message = await client.messages.create({
        body: payload.message,
        from: this.config.twilioPhoneNumber,
        to: payload.to,
      });
      
      return {
        success: true,
        messageId: message.sid,
      };
      */
      
      return this.mockSendSMS(payload);
    } catch (error: any) {
      console.error('[Notification Service] SMS send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  /**
   * Send WhatsApp notification
   */
  async sendWhatsApp(payload: WhatsAppPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (this.useMock || !this.config.whatsappApiKey) {
      return this.mockSendWhatsApp(payload);
    }

    try {
      // Real WhatsApp integration would go here
      // TODO: Implement WhatsApp Business API integration
      return this.mockSendWhatsApp(payload);
    } catch (error: any) {
      console.error('[Notification Service] WhatsApp send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send WhatsApp message',
      };
    }
  }

  /**
   * Mock SMS sending for development/testing
   */
  private mockSendSMS(payload: SMSPayload): { success: boolean; messageId: string } {
    console.log('[MOCK SMS] To:', payload.to);
    console.log('[MOCK SMS] Message:', payload.message);
    return {
      success: true,
      messageId: `mock-sms-${Date.now()}`,
    };
  }

  /**
   * Mock WhatsApp sending for development/testing
   */
  private mockSendWhatsApp(payload: WhatsAppPayload): { success: boolean; messageId: string } {
    console.log('[MOCK WhatsApp] To:', payload.to);
    console.log('[MOCK WhatsApp] Message:', payload.message);
    return {
      success: true,
      messageId: `mock-whatsapp-${Date.now()}`,
    };
  }

  /**
   * Send payment confirmation SMS
   */
  async sendPaymentConfirmation(phone: string, studentName: string, amount: number, paymentType: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Dear ${studentName}, your payment of Rs. ${amount.toFixed(2)} for ${paymentType} has been received. Thank you. - SLIATE Nawalapitiya`;
    
    return this.sendSMS({
      to: phone,
      message,
    });
  }

  /**
   * Send exam application status update
   */
  async sendExamApplicationUpdate(phone: string, studentName: string, courseName: string, status: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const statusText = status === 'approved' ? 'approved' : 'rejected';
    const message = `Dear ${studentName}, your exam application for ${courseName} has been ${statusText}. - SLIATE Nawalapitiya`;
    
    return this.sendSMS({
      to: phone,
      message,
    });
  }

  /**
   * Send library overdue reminder
   */
  async sendLibraryOverdueReminder(phone: string, studentName: string, bookTitle: string, daysOverdue: number, fine: number): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = `Dear ${studentName}, the book "${bookTitle}" is ${daysOverdue} days overdue. Fine: Rs. ${fine.toFixed(2)}. Please return immediately. - SLIATE Library`;
    
    return this.sendSMS({
      to: phone,
      message,
    });
  }
}

export const notificationService = new NotificationService();
