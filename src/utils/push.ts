interface ExpoMessage {
  to: string | string[];
  sound?: 'default';
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Expo batch API acepta hasta 100 mensajes por llamada
export async function sendPushNotifications(messages: ExpoMessage[]): Promise<void> {
  if (messages.length === 0) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
    });
  } catch {
    // Non-fatal: las push notifications son best-effort
  }
}
