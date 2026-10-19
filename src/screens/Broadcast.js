import React, { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { COLORS } from '../config';
import { notify } from '../notifications';
import { supabase } from '../supabase';
import { Btn, Field } from '../ui';
import { SoundPicker } from './SoundSettings';

// المالك يرسل إشعاراً لكل المستخدمين (حتى الزوار) بالصوت الذي يختاره
export default function Broadcast() {
  useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sound, setSound] = useState('melody');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const send = async () => {
    if (!title.trim()) return setMsg('اكتب عنوان الإشعار.');
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('notify', { body: { type: 'broadcast', title: title.trim(), body: body.trim(), sound } });
    setBusy(false);
    if (error) return setMsg('تعذّر الإرسال: ' + (error.message || ''));
    setMsg(`تم الإرسال ✅ (${data?.sent ?? 0} من ${data?.devices ?? 0} جهاز)`);
    setTitle(''); setBody('');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Field label="العنوان" value={title} onChangeText={setTitle} placeholder="مثال: خصم 30% اليوم فقط" />
      <Field label="النص" value={body} onChangeText={setBody} multiline placeholder="تفاصيل الإعلان" />
      <Text style={s.label}>صوت الإشعار</Text>
      <SoundPicker value={sound} onChange={setSound} />
      {msg ? <Text style={s.msg}>{msg}</Text> : null}
      <Btn title="إرسال للجميع" onPress={send} loading={busy} style={{ marginTop: 18 }} />
    </ScrollView>
  );
}

const s = themed(() => ({
  label: { textAlign: 'right', color: COLORS.dark, fontWeight: '600', marginTop: 4 },
  msg: { color: COLORS.primary, textAlign: 'right', marginTop: 14, fontWeight: '600' },
}));
