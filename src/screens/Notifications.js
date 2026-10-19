import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { COLORS, fmtDate } from '../config';
import { useNotifs } from '../NotifContext';
import { Empty } from '../ui';

const ICON = { new_order: '🧾', new_message: '💬', order_status: '📦', broadcast: '📣' };

export default function Notifications() {
  useTheme();
  const { items, markSeen, reload } = useNotifs();
  useEffect(() => { reload(); return () => { markSeen(); }; }, []);
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Empty icon="🔔" text="لا توجد إشعارات بعد" />}
        renderItem={({ item: n }) => (
          <View style={s.card}>
            <Text style={s.icon}>{ICON[n.kind] || '🔔'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{n.title}</Text>
              {n.body ? <Text style={s.body}>{n.body}</Text> : null}
              <Text style={s.time}>{fmtDate(n.created_at)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = themed(() => ({
  card: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 14, marginBottom: 10 },
  icon: { fontSize: 26 },
  title: { fontWeight: '800', color: COLORS.dark, textAlign: 'right' },
  body: { color: COLORS.dark, textAlign: 'right', marginTop: 3, lineHeight: 21 },
  time: { color: COLORS.muted, fontSize: 11.5, textAlign: 'right', marginTop: 6 },
}));
