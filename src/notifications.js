import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { configured } from './config';
import { SOUNDS } from './sounds';

Notifications.setNotificationHandler({
  // والتطبيق مفتوح: نعرض لافتة داخلية مع الصوت (NotifContext) بدل إشعار النظام لتفادي التكرار
  handleNotification: async () => ({ shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false }),
});

// قناة أندرويد لكل صوت (صوت القناة لا يتغير بعد إنشائها)
export async function setupChannels() {
  if (Platform.OS !== 'android') return;
  for (const s of SOUNDS) {
    await Notifications.setNotificationChannelAsync(s.id, {
      name: `إشعارات كاستر ستور — ${s.name}`,
      importance: Notifications.AndroidImportance.MAX,
      sound: s.id === 'default' ? 'default' : `${s.id}.wav`,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1F3A6E',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }
}

export const pushEnabled = async () => (await AsyncStorage.getItem('push_enabled')) !== '0';

export async function registerPush() {
  if (!configured()) return null;
  try {
    await setupChannels();
    if (!Device.isDevice) return null;
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    await AsyncStorage.setItem('push_token', token);
    return token;
  } catch (e) {
    return null;
  }
}

export async function unregisterPush() {
  try {
    const t = await AsyncStorage.getItem('push_token');
    if (t) await supabase.rpc('delete_push_token', { p_token: t });
  } catch (e) {}
}

export async function setPushEnabled(on) {
  await AsyncStorage.setItem('push_enabled', on ? '1' : '0');
  if (on) await registerPush();
  else await unregisterPush();
}

// طلب إرسال إشعار من الخادم (Edge Function)
export async function notify(payload) {
  if (!configured()) return;
  try {
    await supabase.functions.invoke('notify', { body: payload });
  } catch (e) {}
}
