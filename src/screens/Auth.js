import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../config';
import { useAuth } from '../AuthContext';
import { Btn, Field } from '../ui';

// تسجيل الدخول وإنشاء الحساب (هاتف على اليمين، Gmail على اليسار، وتحتهما تسجيل الدخول)
export default function Auth({ navigation, route }) {
  useTheme();
  const { signIn, signUpEmail, signUpPhone } = useAuth();
  const [mode, setMode] = useState('login'); // phone | email | login
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const pick = (m) => { setMode(m); setErr(''); setId(''); setPw(''); setPw2(''); };

  const submit = async () => {
    setErr('');
    if (!id.trim() || !pw) return setErr('املأ جميع الحقول.');
    if (mode !== 'login') {
      if (pw.length < 6) return setErr('كلمة المرور 6 أحرف على الأقل.');
      if (pw !== pw2) return setErr('كلمتا المرور غير متطابقتين.');
    }
    setBusy(true);
    const e = mode === 'login' ? await signIn(id, pw) : mode === 'phone' ? await signUpPhone(id, pw) : await signUpEmail(id, pw);
    setBusy(false);
    if (e) return setErr(e);
    if (route.params?.next) navigation.replace(route.params.next);
    else navigation.goBack();
  };

  const Tab = ({ m, label }) => (
    <Btn title={label} kind={mode === m ? 'primary' : 'ghost'} onPress={() => pick(m)} style={{ flex: 1, paddingHorizontal: 6 }} />
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 18 }} keyboardShouldPersistTaps="handled">
          <Text style={s.logo}>🛍️</Text>
          <Text style={s.title}>كاستر ستور</Text>
          <Text style={s.sub}>سجّل لتتمكن من الشراء ومتابعة طلباتك والتواصل مع الدعم.</Text>

          <View style={s.row}>
            <Tab m="phone" label="إنشاء حساب بالهاتف" />
            <Tab m="email" label="إنشاء حساب Gmail" />
          </View>
          <Btn title="تسجيل الدخول" kind={mode === 'login' ? 'primary' : 'ghost'} onPress={() => pick('login')} style={{ marginBottom: 18 }} />

          <Field
            label={mode === 'phone' ? 'رقم الهاتف' : mode === 'email' ? 'البريد الإلكتروني (Gmail)' : 'البريد الإلكتروني أو رقم الهاتف'}
            value={id}
            onChangeText={setId}
            autoCapitalize="none"
            keyboardType={mode === 'phone' ? 'phone-pad' : mode === 'email' ? 'email-address' : 'default'}
            placeholder={mode === 'phone' ? '07xxxxxxxxx' : mode === 'email' ? 'name@gmail.com' : 'name@gmail.com أو 07xxxxxxxxx'}
          />
          <Field label="كلمة المرور" value={pw} onChangeText={setPw} secureTextEntry autoCapitalize="none" />
          {mode !== 'login' ? <Field label="تأكيد كلمة المرور" value={pw2} onChangeText={setPw2} secureTextEntry autoCapitalize="none" /> : null}

          {err ? <Text style={s.err}>{err}</Text> : null}
          <Btn title={mode === 'login' ? 'دخول' : 'إنشاء الحساب'} onPress={submit} loading={busy} style={{ marginTop: 6 }} />
          <Btn title="المتابعة كزائر" kind="ghost" onPress={() => navigation.goBack()} style={{ marginTop: 10, borderColor: COLORS.line }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = themed(() => ({
  logo: { fontSize: 54, textAlign: 'center', marginTop: 10 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  sub: { color: COLORS.muted, textAlign: 'center', marginTop: 6, marginBottom: 20, lineHeight: 22 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  err: { color: COLORS.danger, textAlign: 'right', marginBottom: 4 },
}));
