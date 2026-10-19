import React, { useState } from 'react';
import { View, Text, ScrollView, Image, Switch, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../config';
import { CATEGORIES } from '../data';
import { supabase } from '../supabase';
import { useProducts } from '../ProductsContext';
import { Btn, Chip, Field } from '../ui';

const rid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const fixUrl = (u) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`);

// إضافة/تعديل منتج: صور وفيديوهات وروابط ووصف بلا حدّ
export default function ProductEditor({ route, navigation }) {
  useTheme();
  const { all, reload } = useProducts();
  const editing = all.find((p) => p.id === route.params?.id);
  const [folder] = useState(editing?.id || rid());
  const [name, setName] = useState(editing?.name || '');
  const [cat, setCat] = useState(editing?.cat || CATEGORIES[3].id);
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [oldPrice, setOldPrice] = useState(editing?.oldPrice ? String(editing.oldPrice) : '');
  const [desc, setDesc] = useState(editing?.desc || '');
  const [featured, setFeatured] = useState(editing?.featured || false);
  const [media, setMedia] = useState(editing?.media || []);
  const [links, setLinks] = useState(editing?.links || []);
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (res.canceled) return;
    setErr('');
    for (const a of res.assets) {
      setUploading((n) => n + 1);
      try {
        const isVideo = a.type === 'video';
        const ext = (a.uri.split('.').pop() || (isVideo ? 'mp4' : 'jpg')).split('?')[0].toLowerCase();
        const path = `${folder}/${rid()}.${ext}`;
        const buf = await (await fetch(a.uri)).arrayBuffer();
        const up = await supabase.storage.from('product-media').upload(path, buf, { contentType: a.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg') });
        if (up.error) throw up.error;
        const { data } = supabase.storage.from('product-media').getPublicUrl(path);
        setMedia((cur) => [...cur, { type: isVideo ? 'video' : 'image', url: data.publicUrl }]);
      } catch (e) {
        setErr('تعذّر رفع ملف: ' + (e.message || ''));
      }
      setUploading((n) => n - 1);
    }
  };

  const save = async () => {
    setErr('');
    if (!name.trim()) return setErr('اكتب اسم المنتج.');
    if (!price || isNaN(Number(price))) return setErr('أدخل سعراً صحيحاً.');
    setSaving(true);
    const row = {
      name: name.trim(),
      category: cat,
      description: desc.trim(),
      price: Number(price),
      old_price: oldPrice && !isNaN(Number(oldPrice)) ? Number(oldPrice) : null,
      featured,
      media,
      links: links.filter((l) => l.url.trim()).map((l) => ({ title: l.title.trim(), url: fixUrl(l.url) })),
    };
    const { error } = editing
      ? await supabase.from('products').update(row).eq('id', editing.id)
      : await supabase.from('products').insert(row);
    setSaving(false);
    if (error) return setErr(error.message);
    await reload();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Field label="اسم المنتج *" value={name} onChangeText={setName} />

        <Text style={s.label}>القسم</Text>
        <View style={s.chips}>
          {CATEGORIES.filter((c) => !['best', 'offers', 'new'].includes(c.id)).map((c) => (
            <Chip key={c.id} label={`${c.emoji} ${c.name}`} on={cat === c.id} onPress={() => setCat(c.id)} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="السعر (د.ع) *" value={price} onChangeText={setPrice} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field label="السعر قبل الخصم" value={oldPrice} onChangeText={setOldPrice} keyboardType="numeric" /></View>
        </View>

        <View style={s.switchRow}>
          <Switch value={featured} onValueChange={setFeatured} trackColor={{ true: COLORS.primary }} />
          <Text style={s.label}>ضمن «الأكثر مبيعاً»</Text>
        </View>

        <Field label="الوصف (بلا حدّ للطول)" value={desc} onChangeText={setDesc} multiline style={{ minHeight: 140 }} />

        <Text style={s.label}>الصور والفيديوهات ({media.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
          <TouchableOpacity style={s.add} onPress={pick}>
            {uploading > 0 ? <ActivityIndicator color={COLORS.primary} /> : <Text style={{ fontSize: 30, color: COLORS.primary }}>＋</Text>}
            <Text style={s.addTxt}>{uploading > 0 ? 'جارٍ الرفع' : 'إضافة'}</Text>
          </TouchableOpacity>
          {media.map((m, i) => (
            <View key={i} style={s.thumb}>
              {m.type === 'image' ? <Image source={{ uri: m.url }} style={{ width: 90, height: 90 }} /> : <Text style={{ fontSize: 30 }}>🎬</Text>}
              <TouchableOpacity style={s.x} onPress={() => setMedia((c) => c.filter((_, j) => j !== i))}><Text style={{ color: '#fff', fontWeight: '800' }}>✕</Text></TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <Text style={[s.label, { marginTop: 14 }]}>روابط (اختياري)</Text>
        {links.map((l, i) => (
          <View key={i} style={s.linkBox}>
            <Field value={l.title} onChangeText={(t) => setLinks((c) => c.map((x, j) => (j === i ? { ...x, title: t } : x)))} placeholder="عنوان الرابط" />
            <Field value={l.url} onChangeText={(t) => setLinks((c) => c.map((x, j) => (j === i ? { ...x, url: t } : x)))} placeholder="https://..." autoCapitalize="none" keyboardType="url" />
            <TouchableOpacity onPress={() => setLinks((c) => c.filter((_, j) => j !== i))}><Text style={{ color: COLORS.danger, textAlign: 'right' }}>حذف الرابط</Text></TouchableOpacity>
          </View>
        ))}
        <Btn kind="ghost" title="+ إضافة رابط" onPress={() => setLinks((c) => [...c, { title: '', url: '' }])} style={{ paddingVertical: 10 }} />

        {err ? <Text style={s.err}>{err}</Text> : null}
        <Btn title={editing ? 'حفظ التعديلات' : 'نشر المنتج'} onPress={save} loading={saving} disabled={uploading > 0} style={{ marginTop: 18 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = themed(() => ({
  label: { textAlign: 'right', color: COLORS.dark, fontWeight: '600', marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  add: { width: 90, height: 90, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  addTxt: { color: COLORS.primary, fontSize: 12 },
  thumb: { width: 90, height: 90, borderRadius: 12, backgroundColor: COLORS.tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  x: { position: 'absolute', top: 4, right: 4, backgroundColor: '#000a', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  linkBox: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, padding: 10, marginBottom: 10 },
  err: { color: COLORS.danger, textAlign: 'right', marginTop: 10 },
}));
