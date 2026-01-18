import { Platform, PermissionsAndroid, Alert } from 'react-native';

// Conditional import for Firebase (only on native)
let messaging: any = null;
if (Platform.OS !== 'web') {
  try {
    messaging = require('@react-native-firebase/messaging').default;
  } catch (e) {
    // Firebase not available - this is OK, notifications will use fallback
    // Silently ignore to avoid console errors
  }
}

import { apiClient } from '../api/client';

/**
 * Notification Service
 * Handles Firebase Cloud Messaging (FCM) for push notifications
 * Replaces toast notifications from web version
 * On web, falls back to alerts
 */

export interface NotificationPayload {
  title?: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private fcmToken: string | null = null;
  private tokenRegistered: boolean = false;

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Web uses browser notifications
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    }

    if (!messaging) {
      // Firebase not available - return true for Android (default enabled)
      return Platform.OS === 'android';
    }

    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      } else if (Platform.OS === 'android') {
        // Android 13+ uses a different permission model
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        // Android < 13 notifications are enabled by default
        return true;
      }
    } catch (error) {
      // Firebase not available - return true for Android (default enabled)
      return Platform.OS === 'android';
    }
    return false;
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return 'web-token';
    }

    if (!messaging) {
      return null;
    }

    try {
      if (!this.fcmToken) {
        this.fcmToken = await messaging().getToken();
      }
      return this.fcmToken;
    } catch (error) {
      // Firebase not available - return null silently
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(userId?: string): Promise<void> {
    try {
      if (this.tokenRegistered) {
        return;
      }

      const token = await this.getToken();
      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      // Register token with backend
      await apiClient.post('/notifications/register-token', {
        fcm_token: token,
        platform: Platform.OS,
        user_id: userId,
      });

      this.tokenRegistered = true;
      console.log('FCM token registered successfully');
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  }

  /**
   * Send a local notification (replaces toast)
   * This will trigger a push notification
   */
  async sendNotification(
    message: string,
    type: 'info' | 'error' = 'info'
  ): Promise<void> {
    if (Platform.OS === 'web') {
      // On web, show browser notification or alert
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(type === 'error' ? 'Erro' : 'Auricapri', {
          body: message,
        });
      } else {
        Alert.alert(
          type === 'error' ? 'Erro' : 'Informação',
          message,
          [{ text: 'OK' }]
        );
      }
      return;
    }

    try {
      const token = await this.getToken();
      if (!token) {
        // Fallback: show alert if notifications not available
        Alert.alert(
          type === 'error' ? 'Erro' : 'Informação',
          message,
          [{ text: 'OK' }]
        );
        return;
      }

      // Send notification via backend
      await apiClient.post('/notifications/send', {
        fcm_token: token,
        title: type === 'error' ? 'Erro' : 'Auricapri',
        body: message,
        type,
        data: {
          type,
          message,
        },
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      // Fallback to alert
      Alert.alert(
        type === 'error' ? 'Erro' : 'Informação',
        message,
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Setup notification listeners
   */
  setupListeners(
    onNotificationReceived?: (notification: NotificationPayload) => void
  ): () => void {
    if (Platform.OS === 'web' || !messaging) {
      return () => {};
    }

    try {
      // Handle notifications when app is in foreground
      const unsubscribeForeground = messaging().onMessage(async (remoteMessage: any) => {
        if (remoteMessage.notification) {
          const payload: NotificationPayload = {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data,
          };
          onNotificationReceived?.(payload);
        }
      });

      // Handle notification tap when app is in background
      messaging().onNotificationOpenedApp((remoteMessage: any) => {
        if (remoteMessage.notification) {
          const payload: NotificationPayload = {
            title: remoteMessage.notification.title,
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data,
          };
          onNotificationReceived?.(payload);
        }
      });

      // Handle notification tap when app is closed
      messaging()
        .getInitialNotification()
        .then((remoteMessage: any) => {
          if (remoteMessage?.notification) {
            const payload: NotificationPayload = {
              title: remoteMessage.notification.title,
              body: remoteMessage.notification.body || '',
              data: remoteMessage.data,
            };
            onNotificationReceived?.(payload);
          }
        })
        .catch(() => {
          // Ignore errors
        });

      // Return cleanup function
      return () => {
        try {
          unsubscribeForeground();
        } catch (e) {
          // Ignore cleanup errors
        }
      };
    } catch (error) {
      // Firebase not available - return no-op cleanup
      return () => {};
    }
  }

  /**
   * Delete FCM token (on logout)
   */
  async deleteToken(): Promise<void> {
    if (Platform.OS === 'web' || !messaging) {
      return;
    }

    try {
      await messaging().deleteToken();
      this.fcmToken = null;
      this.tokenRegistered = false;
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }
}

export const notificationService = new NotificationService();
