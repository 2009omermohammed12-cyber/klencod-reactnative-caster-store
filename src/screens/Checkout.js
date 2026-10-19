import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { COLORS } from '../config';
import { useAuth, validPhone } from '../AuthContext';
import { Btn, Field } from '../ui';

// الخطوة 1: الاسم الثلاثي ورقم الهاتف وملاحظات للمندوب
export default function Checkout({ navigation }) {
  useTheme();
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone ? `0${String(profile.phone).replace(/^964/, '')}` : '');
  const [phone2, setPhone2] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  const next = () => {
    if (name.trim().split(/\s+/).length < 3) return setErr('اكتب الاسم الثلاثي (ثلاثة أسماء على الأقل).');
    if (!validPhone(phone)) return setErr('أدخل رقم هاتف صحيح.');
    if (phone2.trim() && !validPhone(phone2)) return setErr('رقم الهاتف الثاني غير صحيح (أو اتركه فارغاً).');
    setErr('');
    navigation.navigate('CheckoutAddress', { info: { name: name.trim(), phone: phone.trim(), phone2: phone2.trim(), notes: notes.trim() } });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.root} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <Text style={s.step}>الخطوة 1 من 2</Text>
        <Text style={s.h}>بيانات المستلم</Text>
        <Field label="الاسم الثلاثي *" value={name} onChangeText={setName} placeholder="مثال: محمد أحمد علي" />
        <Field label="رقم الهاتف *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="07xxxxxxxxx" />
        <Field label="رقم هاتف آخر (اختياري)" value={phone2} onChangeText={setPhone2} keyboardType="phone-pad" placeholder="07xxxxxxxxx" />
        <Field label="ملاحظات للمندوب (اختياري)" value={notes} onChangeText={setNotes} multiline placeholder="مثال: الاتصال قبل الوصول" />
        {err ? <Text style={s.err}>{err}</Text> : null}
        <Btn title="إكمال" onPress={next} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.bg },
  step: { color: COLORS.muted, textAlign: 'right' },
  h: { fontSize: 20, fontWeight: '800', textAlign: 'right', color: COLORS.dark, marginBottom: 14, marginTop: 2 },
  err: { color: COLORS.danger, textAlign: 'right', marginBottom: 6 },
}));
