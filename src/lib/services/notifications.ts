// Service de notifications multi-canal (Email, Push, In-App)
import nodemailer from 'nodemailer';
export interface NotificationConfig {
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  push: {
    vapidPublicKey: string;
    vapidPrivateKey: string;
    vapidSubject: string;
  };
}
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}
export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}
export interface InAppNotification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}
export class NotificationService {
  private config: NotificationConfig;
  private emailTransporter: nodemailer.Transporter;
  constructor(config: NotificationConfig) {
    this.config = config;
    // Configuration du transporteur email
    this.emailTransporter = nodemailer.createTransporter({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: config.email.auth,
    });
  }
  /**
   * Envoie un email avec template
   */
  async sendEmail(
    to: string | string[],
    templateName: string,
    data: any,
    options?: {
      from?: string;
      replyTo?: string;
      attachments?: any[];
    }
  ): Promise<void> {
    try {
      const template = await this.getEmailTemplate(templateName, data);
      const mailOptions = {
        from: options?.from || this.config.email.auth.user,
        to: Array.isArray(to) ? to.join(', ') : to,
        replyTo: options?.replyTo,
        subject: template.subject,
        html: template.html,
        text: template.text,
        attachments: options?.attachments,
      };
      await this.emailTransporter.sendMail(mailOptions);
      console.log(`Email envoyé à ${to} avec template ${templateName}`);
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
  }
  /**
   * Envoie une notification push
   */
  async sendPushNotification(
    subscription: PushSubscription,
    notification: PushNotification
  ): Promise<void> {
    try {
      // Import dynamique de web-push pour éviter les erreurs SSR
      const webpush = await import('web-push');
      webpush.default.setVapidDetails(
        this.config.push.vapidSubject,
        this.config.push.vapidPublicKey,
        this.config.push.vapidPrivateKey
      );
      const payload = JSON.stringify(notification);
      await webpush.default.sendNotification(subscription, payload);
      console.log('Notification push envoyée');
    } catch (error) {
      console.error('Erreur notification push:', error);
      throw new Error('Erreur lors de l\'envoi de la notification push');
    }
  }
  /**
   * Crée une notification in-app
   */
  async createInAppNotification(
    userId: string,
    notification: Omit<InAppNotification, 'id' | 'userId' | 'read' | 'createdAt'>
  ): Promise<InAppNotification> {
    try {
      const { prisma } = await import('@/lib/prisma');
      const inAppNotification = await prisma.notification.create({
        data: {
          userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data ? JSON.stringify(notification.data) : null,
          read: false,
          expiresAt: notification.expiresAt,
        },
      });
      return {
        id: inAppNotification.id,
        userId: inAppNotification.userId,
        type: inAppNotification.type as any,
        title: inAppNotification.title,
        message: inAppNotification.message,
        data: inAppNotification.data ? JSON.parse(inAppNotification.data) : null,
        read: inAppNotification.read,
        createdAt: inAppNotification.createdAt,
        expiresAt: inAppNotification.expiresAt,
      };
    } catch (error) {
      console.error('Erreur création notification in-app:', error);
      throw new Error('Erreur lors de la création de la notification');
    }
  }
  /**
   * Envoie une notification multi-canal
   */
  async sendMultiChannelNotification(
    userId: string,
    channels: ('email' | 'push' | 'inapp')[],
    data: {
      email?: {
        template: string;
        data: any
      };
      push?: PushNotification;
      inapp?: Omit<InAppNotification, 'id' | 'userId' | 'read' | 'createdAt'>;
    }
  ): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      // Récupérer les préférences utilisateur
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          notificationPreferences: true,
          pushSubscriptions: true,
        },
      });
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      const promises: Promise<any>[] = [];
      // Email
      if (channels.includes('email') && data.email && user.email) {
        const emailEnabled = user.notificationPreferences?.email ?? true;
        if (emailEnabled) {
          promises.push(
            this.sendEmail(user.email, data.email.template, data.email.data)
          );
        }
      }
      // Push
      if (channels.includes('push') && data.push) {
        const pushEnabled = user.notificationPreferences?.push ?? true;
        if (pushEnabled && user.pushSubscriptions.length > 0) {
          user.pushSubscriptions.forEach(sub => {
            promises.push(
              this.sendPushNotification(
                JSON.parse(sub.subscription),
                data.push!
              )
            );
          });
        }
      }
      // In-App
      if (channels.includes('inapp') && data.inapp) {
        const inappEnabled = user.notificationPreferences?.inapp ?? true;
        if (inappEnabled) {
          promises.push(
            this.createInAppNotification(userId, data.inapp)
          );
        }
      }
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Erreur notification multi-canal:', error);
      throw new Error('Erreur lors de l\'envoi des notifications');
    }
  }
  /**
   * Templates d'email prédéfinis
   */
  private async getEmailTemplate(templateName: string, data: any): Promise<EmailTemplate> {
    const templates: Record<string, (data: any) => EmailTemplate> = {
      welcome: (data) => ({
        subject: `Bienvenue sur VoiceCoop, ${data.name} !`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #274755 0%, #2BA297 100%); padding: 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenue sur VoiceCoop !</h1>
            </div>
            <div style="padding: 40px; background: #f8f9fa;">
              <h2 style="color: #274755;">Bonjour ${data.name},</h2>
              <p style="color: #666; line-height: 1.6;">
                Nous sommes ravis de vous accueillir dans la communauté VoiceCoop !
                Votre compte a été créé avec succès.
              </p>
              <p style="color: #666; line-height: 1.6;">
                VoiceCoop est la première plateforme d'IA vocale coopérative.
                Vous pouvez maintenant :
              </p>
              <ul style="color: #666; line-height: 1.8;">
                <li>Converser avec notre IA vocale avancée</li>
                <li>Participer à la gouvernance coopérative</li>
                <li>Bénéficier des revenus partagés</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard"
                   style="background: #2BA297; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
                  Accéder au Dashboard
                </a>
              </div>
            </div>
          </div>
        `,
        text: `Bienvenue sur VoiceCoop, ${data.name} ! Votre compte a été créé avec succès.`,
      }),
      newMessage: (data) => ({
        subject: 'Nouveau message dans votre conversation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #274755;">Nouveau message reçu</h2>
            <p style="color: #666;">Vous avez reçu un nouveau message dans votre conversation "${data.conversationTitle}".</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #333;">${data.messageContent}</p>
            </div>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/conversations/${data.conversationId}"
               style="background: #2BA297; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Voir la conversation
            </a>
          </div>
        `,
        text: `Nouveau message: ${data.messageContent}`,
      }),
      proposalNotification: (data) => ({
        subject: 'Nouvelle proposition de gouvernance',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #274755;">Nouvelle proposition à voter</h2>
            <p style="color: #666;">Une nouvelle proposition a été soumise et nécessite votre vote.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #274755;">${data.proposalTitle}</h3>
              <p style="color: #666;">${data.proposalDescription}</p>
            </div>
            <a href="${process.env.NEXTAUTH_URL}/dashboard/governance"
               style="background: #2BA297; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Voter maintenant
            </a>
          </div>
        `,
        text: `Nouvelle proposition: ${data.proposalTitle}`,
      }),
    };
    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template ${templateName} non trouvé`);
    }
    return template(data);
  }
  /**
   * Teste la configuration email
   */
  async testEmailConfiguration(): Promise<boolean> {
    try {
      await this.emailTransporter.verify();
      return true;
    } catch (error) {
      console.error('Erreur configuration email:', error);
      return false;
    }
  }
}
// Factory function
export function createNotificationService(): NotificationService {
  const config: NotificationConfig = {
    email: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    },
    push: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
      vapidSubject: process.env.VAPID_SUBJECT || 'mailto:contact@voicecoop.com',
    },
  };
  return new NotificationService(config);
}
// Service de simulation pour le développement
export class MockNotificationService {
  async sendEmail(): Promise<void> {
    console.log('📧 [MOCK] Email envoyé');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  async sendPushNotification(): Promise<void> {
    console.log('📱 [MOCK] Notification push envoyée');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  async createInAppNotification(): Promise<InAppNotification> {
    console.log('🔔 [MOCK] Notification in-app créée');
    return {
      id: 'mock-id',
      userId: 'mock-user',
      type: 'info',
      title: 'Mock Notification',
      message: 'Ceci est une notification de test',
      read: false,
      createdAt: new Date(),
    };
  }
  async sendMultiChannelNotification(): Promise<void> {
    console.log('📢 [MOCK] Notification multi-canal envoyée');
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}
// Instance singleton
export const notificationService = process.env.NODE_ENV === 'development' && !process.env.SMTP_USER
  ? new MockNotificationService() as any
  : createNotificationService();
// Types d'export
export type {
  NotificationConfig,
  EmailTemplate,
  PushNotification,
  InAppNotification,
};