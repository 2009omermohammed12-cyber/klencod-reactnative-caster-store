import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, fmtDate } from '../config';
import { supabase } from '../supabase';
import { useAuth } from '../AuthContext';
import { notify } from '../notifications';

function ChatImage({ path }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    supabase.storage.from('chat-media').createSignedUrl(path, 3600).then(({ data }) => setUrl(data?.signedUrl || null));
  }, [path]);
  if (!url) return <View style={s.imgBox}><ActivityIndicator color={COLORS.primary} /></View>;
  return <Image source={{ uri: url }} style={s.imgBox} resizeMode="cover" />;
}

// محادثة سرية بين مستخدم واحد والمالك. owner=true عند عرضها من جهة المالك.
export function ChatView({ customerId, owner }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const otherRole = owner ? 'customer' : 'owner';
  const readCol = owner ? 'read_by_owner' : 'read_by_customer';

  const load = useCallback(async () => {
    const { data } = await supabase.from('messages').select('*').eq('customer_id', customerId).order('created_at', { ascending: true });
    const rows = data || [];
    setMsgs(rows);
    if (rows.some((m) => m.sender_role === otherRole && !m[readCol])) {
      await supabase.from('messages').update({ [readCol]: true }).eq('customer_id', customerId).eq('sender_role', otherRole).eq(readCol, false);
    }
  }, [customerId, otherRole, readCol]);

  useEffect(() => {
    load();
    const ch = supabase.channel('chat-' + customerId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `customer_id=eq.${customerId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load, customerId]);

  const send = async (payload) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ customer_id: customerId, sender_id: user.id, sender_role: owner ? 'owner' : 'customer', ...payload })
      .select()
      .single();
    if (!error && data) {
      setMsgs((cur) => (cur.some((m) => m.id === data.id) ? cur : [...cur, data]));
      notify({ type: 'new_message', ref_id: data.id });
    }
  };

  const sendText = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    await send({ body: t });
  };

  const sendImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (res.canceled || !res.assets?.length) return;
    setBusy(true);
    try {
      const a = res.assets[0];
      const buf = await (await fetch(a.uri)).arrayBuffer();
      const path = `${customerId}/${Date.now()}.jpg`;
      const up = await supabase.storage.from('chat-media').upload(path, buf, { contentType: a.mimeType || 'image/jpeg' });
      if (!up.error) await send({ image_path: path });
    } catch (e) {}
    setBusy(false);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 12, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={<Text style={s.empty}>{owner ? 'لا توجد رسائل بعد' : 'اكتب رسالتك وسيرد عليك فريق الدعم. المحادثة سرية بينك وبين المتجر.'}</Text>}
        renderItem={({ item: m }) => {
          const mine = m.sender_id === user.id;
          return (
            <View style={[s.bubble, mine ? s.mine : s.theirs]}>
              {m.image_path ? <ChatImage path={m.image_path} /> : null}
              {m.body ? <Text style={[s.txt, mine && { color: COLORS.onPrimary }]}>{m.body}</Text> : null}
              <Text style={[s.time, mine && { color: COLORS.onPrimary, opacity: 0.7 }]}>{fmtDate(m.created_at).slice(11)}</Text>
            </View>
          );
        }}
      />
      <View style={s.inputBar}>
        <TouchableOpacity onPress={sendImage} disabled={busy} style={s.iconBtn}>
          {busy ? <ActivityIndicator color={COLORS.primary} /> : <Text style={{ fontSize: 22 }}>🖼️</Text>}
        </TouchableOpacity>
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder="اكتب رسالة..." placeholderTextColor={COLORS.muted} textAlign="right" multiline />
        <TouchableOpacity onPress={sendText} style={[s.iconBtn, { backgroundColor: COLORS.primary }]}>
          <Text style={{ color: COLORS.onPrimary, fontSize: 18, fontWeight: '800' }}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function Chat({ route }) {
  useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ChatView customerId={route.params.customerId} owner />
    </View>
  );
}

const s = themed(() => ({
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 60, lineHeight: 24, paddingHorizontal: 20 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 10, marginBottom: 8 },
  mine: { alignSelf: 'flex-start', backgroundColor: COLORS.primary },
  theirs: { alignSelf: 'flex-end', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line },
  txt: { color: COLORS.dark, textAlign: 'right', lineHeight: 22 },
  time: { fontSize: 10.5, color: COLORS.muted, marginTop: 4, textAlign: 'left' },
  imgBox: { width: 200, height: 200, borderRadius: 12, marginBottom: 6, backgroundColor: COLORS.tint, alignItems: 'center', justifyContent: 'center' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.line },
  input: { flex: 1, maxHeight: 110, backgroundColor: COLORS.bg, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, fontSize: 15, color: COLORS.dark },
  iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.tint },
}));
