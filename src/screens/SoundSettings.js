import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { COLORS } from '../config';
import { supabase } from '../supabase';
import { SOUNDS, soundName, playSound, allSounds, loadCustomSounds, onCustomSounds } from '../sounds';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { Btn } from '../ui';

export const SOUND_EVENTS = [
  { key: 'sound_order', label: 'عند وصول طلب جديد (يصلك أنت)' },
  { key: 'sound_message', label: 'عند وصول رسالة من مستخدم (يصلك أنت)' },
  { key: 'sound_reply', label: 'عند ردّك على مستخدم (يصل للمستخدم)' },
  { key: 'sound_status', label: 'عند تغيير حالة طلب (يصل للمستخدم)' },
  { key: 'sound_broadcast', label: 'الإعلانات العامة (الافتراضي)' },
];

export function SoundPicker({ value, onChange }) {
  const [, force] = useState(0);
  useEffect(() => { loadCustomSounds(); return onCustomSounds(() => force((n) => n + 1)); }, []);
  return (
    <View style={s.list}>
      {allSounds().map((x) => (
        <TouchableOpacity key={x.id} style={[s.item, value === x.id && s.itemOn]} onPress={() => { onChange(x.id); playSound(x.id); }}>
          <Text style={[s.itemTxt, value === x.id && { color: COLORS.onPrimary }]}>{value === x.id ? '✓ ' : '▶ '}{x.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// رفع صوت من جهاز المالك (mp3 / wav / m4a ...)
function UploadSound() {
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => { loadCustomSounds().then(setList); return onCustomSounds(setList); }, []);

  const pick = async () => {
    setMsg('');
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (r.canceled || !r.assets?.[0]) return;
    const a = r.assets[0];
    if (a.size && a.size > 5 * 1024 * 1024) return setMsg('الملف أكبر من 5MB. اختر صوتاً أقصر.');
    setBusy(true);
    try {
      const ext = (a.name?.split('.').pop() || 'mp3').toLowerCase();
      const path = `${Date.now()}.${ext}`;
      const buf = await (await fetch(a.uri)).arrayBuffer();
      const up = await supabase.storage.from('sounds').upload(path, buf, { contentType: a.mimeType || 'audio/mpeg' });
      if (up.error) throw up.error;
      const url = supabase.storage.from('sounds').getPublicUrl(path).data.publicUrl;
      const name = (a.name || 'صوت').replace(/\.[^.]+$/, '');
      const ins = await supabase.from('custom_sounds').insert({ name, url, path });
      if (ins.error) throw ins.error;
      await loadCustomSounds();
      setMsg('تمت إضافة الصوت ✅ يمكنك اختياره الآن لأي إشعار.');
    } catch (e) { setMsg('تعذّر الرفع: ' + (e.message || e)); }
    setBusy(false);
  };

  const remove = (x) => Alert.alert('حذف الصوت', `حذف «${x.name}»؟`, [
    { text: 'إلغاء', style: 'cancel' },
    { text: 'حذف', style: 'destructive', onPress: async () => {
      await supabase.from('custom_sounds').delete().eq('id', x.rawId);
      await supabase.storage.from('sounds').remove([x.path]);
      loadCustomSounds();
    } },
  ]);

  return (
    <View style={s.card}>
      <Text style={s.label}>أصواتي المرفوعة من الجهاز</Text>
      <Text style={s.note}>تُشغَّل بالكامل عند فتح التطبيق. والتطبيق مغلق يستخدم النظام صوتاً مضمّناً بديلاً (الرنّة)، لأن أندرويد وآيفون يشترطان أن يكون صوت الإشعار داخل ملفات التطبيق.</Text>
      {list.map((x) => (
        <View key={x.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
          <TouchableOpacity onPress={() => remove(x)}><Text style={{ color: COLORS.danger }}>🗑 حذف</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => playSound(x.id)}><Text style={{ color: COLORS.dark }}>▶ {x.name}</Text></TouchableOpacity>
        </View>
      ))}
      {msg ? <Text style={{ color: COLORS.primary, textAlign: 'right', marginVertical: 6 }}>{msg}</Text> : null}
      <Btn title="＋ رفع صوت من الجهاز" kind="ghost" onPress={pick} loading={busy} />
    </View>
  );
}

// المالك يختار صوتاً لكل نوع إشعار
export default function SoundSettings() {
  useTheme();
  const [cfg, setCfg] = useState(null);
  const [open, setOpen] = useState(null);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('id', 1).single().then(({ data }) => setCfg(data));
  }, []);

  const save = async () => {
    setErr('');
    const { id, ...rest } = cfg;
    const { error } = await supabase.from('app_settings').update(rest).eq('id', 1);
    if (error) return setErr(error.message);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!cfg) return <Text style={{ textAlign: 'center', marginTop: 60, color: COLORS.muted }}>جارٍ التحميل...</Text>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={s.note}>اختر صوتاً لكل نوع إشعار. اضغط على الصوت لسماعه ثم احفظ.</Text>
      {SOUND_EVENTS.map((e) => (
        <View key={e.key} style={s.card}>
          <TouchableOpacity style={s.head} onPress={() => setOpen(open === e.key ? null : e.key)}>
            <Text style={s.label}>{e.label}</Text>
            <Text style={s.val}>{soundName(cfg[e.key])}  {open === e.key ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {open === e.key ? <SoundPicker value={cfg[e.key]} onChange={(v) => setCfg({ ...cfg, [e.key]: v })} /> : null}
        </View>
      ))}
      <UploadSound />
      {err ? <Text style={{ color: COLORS.danger, textAlign: 'right' }}>{err}</Text> : null}
      {saved ? <Text style={{ color: COLORS.ok, textAlign: 'right', fontWeight: '700', marginBottom: 6 }}>تم الحفظ ✅</Text> : null}
      <Btn title="حفظ الأصوات" onPress={save} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const s = themed(() => ({
  note: { color: COLORS.muted, textAlign: 'right', marginBottom: 12, lineHeight: 22 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 12, marginBottom: 10 },
  head: { gap: 4 },
  label: { fontWeight: '700', color: COLORS.dark, textAlign: 'right' },
  val: { color: COLORS.primary, textAlign: 'right', fontWeight: '600' },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  item: { backgroundColor: COLORS.bg, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.line },
  itemOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  itemTxt: { color: COLORS.dark, fontSize: 13 },
}));
