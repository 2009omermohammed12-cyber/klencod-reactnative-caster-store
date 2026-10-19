import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { COLORS } from '../config';
import { useAuth } from '../AuthContext';
import { Btn, Field } from '../ui';

export default function ChangePassword({ navigation }) {
  useTheme();
  const { changePassword, isOwner } = useAuth();
  const [oldPw, setOld] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr('');
    if (!oldPw) return setErr('أدخل كلمة المرور الحالية.');
    if (pw.length < 6) return setErr('كلمة المرور الجديدة 6 أحرف على الأقل.');
    if (pw !== pw2) return setErr('كلمتا المرور الجديدتان غير متطابقتين.');
    setBusy(true);
    const e = await changePassword(oldPw, pw);
    setBusy(false);
    if (e) return setErr(e);
    setOk(true);
    setOld(''); setPw(''); setPw2('');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={s.h}>{isOwner ? 'تغيير كلمة مرور حساب المالك' : 'تغيير كلمة المرور'}</Text>
      <Field label="كلمة المرور الحالية" value={oldPw} onChangeText={setOld} secureTextEntry autoCapitalize="none" />
      <Field label="كلمة المرور الجديدة" value={pw} onChangeText={setPw} secureTextEntry autoCapitalize="none" />
      <Field label="تأكيد كلمة المرور الجديدة" value={pw2} onChangeText={setPw2} secureTextEntry autoCapitalize="none" />
      {err ? <Text style={s.err}>{err}</Text> : null}
      {ok ? <Text style={s.ok}>تم تغيير كلمة المرور بنجاح ✅</Text> : null}
      <Btn title="حفظ" onPress={save} loading={busy} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

const s = themed(() => ({
  h: { fontSize: 20, fontWeight: '800', textAlign: 'right', color: COLORS.dark, marginBottom: 14 },
  err: { color: COLORS.danger, textAlign: 'right', marginBottom: 6 },
  ok: { color: COLORS.ok, textAlign: 'right', marginBottom: 6, fontWeight: '700' },
}));
