import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, Linking, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, STORE, displayName } from '../config';
import { themed, useTheme } from '../theme';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { pushEnabled, setPushEnabled } from '../notifications';
import { Btn, Chip, Field } from '../ui';

function Row({ icon, label, value, onPress, danger }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={s.rowIcon}>{icon}</Text>
      <Text style={[s.rowLabel, danger && { color: COLORS.danger }]}>{label}</Text>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      {onPress ? <Text style={s.chev}>‹</Text> : null}
    </TouchableOpacity>
  );
}
const Section = ({ title, children }) => (
  <View style={{ marginTop: 18 }}>
    <Text style={s.section}>{title}</Text>
    <View style={s.group}>{children}</View>
  </View>
);

const MODES = [
  { id: 'system', label: 'تلقائي (حسب الجهاز)' },
  { id: 'light', label: '☀️ فاتح' },
  { id: 'dark', label: '🌙 داكن' },
];

export default function Settings({ navigation }) {
  const { mode, setMode } = useTheme();
  const { session, profile, isOwner, signOut, updateName, deleteAccount } = useAuth();
  const { clear } = useCart();
  const [push, setPush] = useState(true);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { pushEnabled().then(setPush); }, []);
  useEffect(() => { setName(profile?.full_name || ''); }, [profile?.full_name]);

  const togglePush = async (v) => { setPush(v); await setPushEnabled(v); };
  const saveName = async () => {
    const e = await updateName(name);
    setMsg(e || 'تم حفظ الاسم ✅');
    setTimeout(() => setMsg(''), 2500);
  };
  const logout = () =>
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: signOut },
    ]);

  const removeAccount = () =>
    Alert.alert(
      'حذف الحساب',
      'سيتم حذف حسابك وبياناتك ومحادثات الدعم نهائياً، ولا يمكن فتح هذا الحساب مرة أخرى.\n\nهل أنت متأكد؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائي',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const e = await deleteAccount();
            setDeleting(false);
            if (e) return Alert.alert('تعذّر الحذف', e);
            clear();
            Alert.alert('تم حذف الحساب', 'تم حذف حسابك نهائياً.');
          },
        },
      ]
    );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={s.title}>الإعدادات</Text>

        {session ? (
          <View style={s.profile}>
            <Text style={s.pName}>{displayName(profile)}</Text>
            <Text style={s.pSub}>{profile?.email || (profile?.phone ? `+${profile.phone}` : '')}</Text>
            {isOwner ? <Text style={s.owner}>👑 حساب المالك</Text> : null}
          </View>
        ) : (
          <View style={s.profile}>
            <Text style={s.pName}>أنت تتصفح كزائر</Text>
            <Btn title="تسجيل الدخول / إنشاء حساب" onPress={() => navigation.navigate('Auth')} style={{ marginTop: 10 }} />
          </View>
        )}

        {isOwner ? (
          <Section title="لوحة المالك">
            <Row icon="🛍️" label="إدارة المنتجات" onPress={() => navigation.navigate('ManageProducts')} />
            <Row icon="📣" label="إرسال إشعار للجميع" onPress={() => navigation.navigate('Broadcast')} />
            <Row icon="🗂️" label="الإشعارات المنشورة (تعديل / حذف)" onPress={() => navigation.navigate('ManageNotifications')} />
            <Row icon="🎵" label="أصوات الإشعارات" onPress={() => navigation.navigate('SoundSettings')} />
          </Section>
        ) : null}

        {session ? (
          <Section title="الحساب">
            <View style={{ padding: 12 }}>
              <Field label="الاسم" value={name} onChangeText={setName} placeholder="اسمك الظاهر" />
              <Btn title="حفظ الاسم" kind="ghost" onPress={saveName} style={{ paddingVertical: 10 }} />
              {msg ? <Text style={s.msg}>{msg}</Text> : null}
            </View>
            <Row icon="🔑" label={isOwner ? 'تغيير كلمة مرور حساب المالك' : 'تغيير كلمة المرور'} onPress={() => navigation.navigate('ChangePassword')} />
          </Section>
        ) : null}

        <Section title="المظهر">
          <View style={{ padding: 12 }}>
            <Text style={s.hint}>اختر وضع عرض التطبيق</Text>
            <View style={s.modes}>
              {MODES.map((m) => (
                <Chip key={m.id} label={m.label} on={mode === m.id} onPress={() => setMode(m.id)} />
              ))}
            </View>
          </View>
        </Section>

        <Section title="الإشعارات">
          <Row icon="🔔" label="صندوق الإشعارات" onPress={() => navigation.navigate('Notifications')} />
          <View style={s.row}>
            <Text style={s.rowIcon}>🔊</Text>
            <Text style={s.rowLabel}>تفعيل إشعارات الجهاز</Text>
            <Switch value={push} onValueChange={togglePush} trackColor={{ true: COLORS.primary }} />
          </View>
        </Section>

        <Section title="عن التطبيق">
          <Row icon="ℹ️" label="الإصدار" value={STORE.version} />
          <Row icon="📄" label="شروط الاستخدام" onPress={() => navigation.navigate('Legal', { kind: 'terms' })} />
          <Row icon="🔒" label="سياسة الخصوصية" onPress={() => navigation.navigate('Legal', { kind: 'privacy' })} />
          <Row icon="📘" label="تواصلوا معنا عبر فيسبوك" onPress={() => Linking.openURL(STORE.facebook).catch(() => {})} />
          <Row icon="📤" label="مشاركة التطبيق" onPress={() => Share.share({ message: `🛍️ جرّب تطبيق ${STORE.name} للتسوق — توصيل مجاني لكل المحافظات والدفع عند الاستلام.\n${STORE.shareUrl || STORE.facebook}` })} />
        </Section>

        {session ? (
          <Section title=" ">
            <Row icon="🚪" label="تسجيل الخروج" onPress={logout} danger />
            {!isOwner ? <Row icon="⚠️" label={deleting ? 'جارٍ حذف الحساب...' : 'حذف الحساب'} onPress={deleting ? undefined : removeAccount} danger /> : null}
          </Section>
        ) : null}

        <Text style={s.foot}>{STORE.name} • الإصدار {STORE.version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark, textAlign: 'right', marginBottom: 12 },
  profile: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, padding: 16 },
  pName: { fontSize: 18, fontWeight: '800', textAlign: 'right', color: COLORS.dark },
  pSub: { color: COLORS.muted, textAlign: 'right', marginTop: 2 },
  owner: { color: COLORS.primary, fontWeight: '700', textAlign: 'right', marginTop: 8 },
  section: { color: COLORS.muted, fontWeight: '700', textAlign: 'right', marginBottom: 6, marginHorizontal: 4 },
  group: { backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  rowIcon: { fontSize: 20, marginLeft: 12 },
  rowLabel: { flex: 1, textAlign: 'right', color: COLORS.dark, fontWeight: '600' },
  rowValue: { color: COLORS.muted, marginHorizontal: 8 },
  chev: { color: COLORS.muted, fontSize: 22 },
  msg: { color: COLORS.ok, textAlign: 'right', marginTop: 8 },
  hint: { color: COLORS.muted, textAlign: 'right', marginBottom: 10 },
  modes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  foot: { textAlign: 'center', color: COLORS.muted, marginTop: 24, fontSize: 12 },
}));
