import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playSound } from './sounds';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { configured } from './config';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);
const KEY = 'notif_seen_at';

export function NotifProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [seenAt, setSeenAt] = useState(null);
  const uid = user?.id;
  const [banner, setBanner] = useState(null);
  const slide = useRef(new Animated.Value(-140)).current;
  const timer = useRef(null);
  const show = (n) => {
    setBanner(n);
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
    clearTimeout(timer.current);
    timer.current = setTimeout(hide, 5000);
  };
  const hide = () => Animated.timing(slide, { toValue: -140, duration: 250, useNativeDriver: true }).start(() => setBanner(null));

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => setSeenAt(v || new Date(0).toISOString())).catch(() => setSeenAt(new Date(0).toISOString()));
  }, []);

  const load = useCallback(async () => {
    if (!configured()) return;
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    setItems(data || []);
  }, []);

  useEffect(() => {
    load();
    if (!configured()) return;
    const ch = supabase.channel('notif-rt-' + (uid || 'guest'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        load();
        const n = payload.new;
        if (payload.eventType === 'INSERT' && n) { show(n); playSound(n.sound || 'default'); }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, uid]);

  const markSeen = async () => {
    const now = new Date().toISOString();
    setSeenAt(now);
    try { await AsyncStorage.setItem(KEY, now); } catch (e) {}
  };

  const unread = seenAt ? items.filter((i) => i.created_at > seenAt).length : 0;
  const ICON = { new_order: '🧾', new_message: '💬', order_status: '📦', broadcast: '📣' };
  return (
    <Ctx.Provider value={{ items, unread, markSeen, reload: load }}>
      {children}
      {banner ? (
        <Animated.View pointerEvents="box-none" style={[st.wrap, { transform: [{ translateY: slide }] }]}>
          <SafeAreaView edges={['top']} pointerEvents="box-none">
            <TouchableOpacity activeOpacity={0.9} style={st.card} onPress={hide}>
              <Text style={st.icon}>{ICON[banner.kind] || '🔔'}</Text>
              <Text style={{ flex: 1 }}>
                <Text style={st.title}>{banner.title}{'\n'}</Text>
                <Text style={st.body}>{banner.body || ''}</Text>
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export const useNotifs = () => useContext(Ctx);

const st = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, paddingHorizontal: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#0B3D2E', borderRadius: 16, padding: 14, marginTop: 6, elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10 },
  icon: { fontSize: 26 },
  title: { color: '#fff', fontWeight: '800', fontSize: 15, textAlign: 'right' },
  body: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'right' },
});
