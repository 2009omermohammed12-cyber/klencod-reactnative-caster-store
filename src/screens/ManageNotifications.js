import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { themed, useTheme } from '../theme';
import { COLORS, fmtDate } from '../config';
import { supabase } from '../supabase';
import { soundName } from '../sounds';
import { Btn, Field, Empty } from '../ui';
import { SoundPicker } from './SoundSettings';

// المالك: تعديل أو حذف الإشعارات المنشورة للجميع (إذا نشر إشعاراً بالخطأ)
export default function ManageNotifications() {
  useTheme();
  const [items, setItems] = useState([]);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('notifications').select('*').is('user_id', null).eq('kind', 'broadcast').order('created_at', { ascending: false }).limit(100);
    setItems(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const del = (n) => Alert.alert('حذف الإشعار', 'سيُحذف من صندوق إشعارات جميع المستخدمين. (الإشعار الذي وصل شاشاتهم فعلاً لا يمكن سحبه).', [
    { text: 'إلغاء', style: 'cancel' },
    { text: 'حذف', style: 'destructive', onPress: async () => { await supabase.from('notifications').delete().eq('id', n.id); load(); } },
  ]);

  const save = async () => {
    if (!edit.title.trim()) return;
    setBusy(true);
    await supabase.from('notifications').update({ title: edit.title.trim(), body: edit.body, sound: edit.sound }).eq('id', edit.id);
    setBusy(false); setEdit(null); load();
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={<Empty icon="📣" text="لا توجد إشعارات منشورة" />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.title}>{item.title}</Text>
            {item.body ? <Text style={s.body}>{item.body}</Text> : null}
            <Text style={s.meta}>{fmtDate(item.created_at)} • 🔊 {soundName(item.sound || 'default')}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Btn title="تعديل" kind="ghost" style={{ flex: 1, paddingVertical: 9 }} onPress={() => setEdit({ ...item, body: item.body || '' })} />
              <Btn title="حذف" kind="danger" style={{ flex: 1, paddingVertical: 9 }} onPress={() => del(item)} />
            </View>
          </View>
        )}
      />
      <Modal visible={!!edit} animationType="slide" onRequestClose={() => setEdit(null)}>
        <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 18, paddingTop: 50 }}>
          <Text style={s.h}>تعديل الإشعار</Text>
          <Field label="العنوان" value={edit?.title} onChangeText={(v) => setEdit({ ...edit, title: v })} />
          <Field label="النص" value={edit?.body} onChangeText={(v) => setEdit({ ...edit, body: v })} multiline />
          <Text style={s.label}>الصوت</Text>
          <SoundPicker value={edit?.sound || 'default'} onChange={(v) => setEdit({ ...edit, sound: v })} />
          <Btn title="حفظ" onPress={save} loading={busy} style={{ marginTop: 18 }} />
          <Btn title="إلغاء" kind="ghost" onPress={() => setEdit(null)} style={{ marginTop: 10 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const s = themed(() => ({
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 14, marginBottom: 10 },
  title: { fontWeight: '800', color: COLORS.dark, textAlign: 'right' },
  body: { color: COLORS.dark, textAlign: 'right', marginTop: 4, lineHeight: 21 },
  meta: { color: COLORS.muted, fontSize: 12, textAlign: 'right', marginTop: 6 },
  h: { fontSize: 20, fontWeight: '800', textAlign: 'right', color: COLORS.dark, marginBottom: 14 },
  label: { textAlign: 'right', color: COLORS.dark, fontWeight: '600', marginTop: 4 },
}));
