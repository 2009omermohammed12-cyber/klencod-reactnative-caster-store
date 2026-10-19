import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, displayName, fmtDate } from '../config';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { Avatar, Empty } from '../ui';
import { ChatView } from './Chat';

export default function Support({ navigation }) {
  useTheme();
  const { session, isOwner } = useAuth();

  if (!session) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <Text style={s.title}>الدعم</Text>
        <Empty icon="💬" text="سجّل دخولك لتتواصل مع فريق الدعم" action="تسجيل الدخول" onAction={() => navigation.navigate('Auth')} />
      </SafeAreaView>
    );
  }
  if (isOwner) return <OwnerInbox navigation={navigation} />;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Text style={s.title}>الدعم</Text>
      <ChatView customerId={session.user.id} owner={false} />
    </SafeAreaView>
  );
}

// صندوق المالك: كل من راسله يظهر كملف شخصي مثل ماسنجر
function OwnerInbox({ navigation }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: msgs } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(1000);
    const byCustomer = new Map();
    (msgs || []).forEach((m) => {
      const e = byCustomer.get(m.customer_id) || { id: m.customer_id, last: m, unread: 0 };
      if (m.sender_role === 'customer' && !m.read_by_owner) e.unread++;
      byCustomer.set(m.customer_id, e);
    });
    const ids = [...byCustomer.keys()];
    let profiles = [];
    if (ids.length) profiles = (await supabase.from('profiles').select('id,full_name,phone,email').in('id', ids)).data || [];
    const pmap = new Map(profiles.map((p) => [p.id, p]));
    setRows([...byCustomer.values()].map((e) => ({ ...e, profile: pmap.get(e.id) })));
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    const ch = supabase.channel('inbox-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Text style={s.title}>رسائل الدعم</Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Empty icon="💬" text="لم يراسلك أحد بعد" />}
        renderItem={({ item: r }) => {
          const name = displayName(r.profile);
          return (
            <TouchableOpacity style={s.row} onPress={() => navigation.navigate('Chat', { customerId: r.id, title: name })} activeOpacity={0.8}>
              <Avatar name={name} />
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={s.name} numberOfLines={1}>{name}</Text>
                <Text style={[s.last, r.unread > 0 && { color: COLORS.dark, fontWeight: '700' }]} numberOfLines={1}>
                  {r.last.sender_role === 'owner' ? 'أنت: ' : ''}{r.last.body || '📷 صورة'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={s.time}>{fmtDate(r.last.created_at).slice(5)}</Text>
                {r.unread > 0 ? <Text style={s.badge}>{r.unread}</Text> : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark, textAlign: 'right', paddingHorizontal: 16, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.line, backgroundColor: COLORS.card },
  name: { fontWeight: '800', color: COLORS.dark, textAlign: 'right', fontSize: 15 },
  last: { color: COLORS.muted, textAlign: 'right', marginTop: 3 },
  time: { color: COLORS.muted, fontSize: 11.5 },
  badge: { backgroundColor: COLORS.primary, color: COLORS.onPrimary, minWidth: 22, textAlign: 'center', borderRadius: 11, overflow: 'hidden', fontSize: 12, fontWeight: '800', paddingHorizontal: 5, paddingVertical: 1 },
}));
