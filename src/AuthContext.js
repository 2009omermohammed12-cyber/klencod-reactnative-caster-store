import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { configured } from './config';
import { registerPush, unregisterPush, pushEnabled } from './notifications';

const AuthContext = createContext(null);
const PHONE_DOMAIN = 'phone.casterstore.app';

// 07701234567 / 7701234567 / +964770... → 964770...
export function normalizePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('07') && d.length === 11) d = '964' + d.slice(1);
  else if (d.startsWith('7') && d.length === 10) d = '964' + d;
  return d;
}
export const validPhone = (raw) => /^\d{10,15}$/.test(normalizePhone(raw));
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e).trim());
const toEmail = (id) => {
  const v = String(id).trim();
  return v.includes('@') ? v.toLowerCase() : `${normalizePhone(v)}@${PHONE_DOMAIN}`;
};

function arabicError(e) {
  const m = String(e?.message || e || '');
  if (/Invalid login credentials/i.test(m)) return 'بيانات الدخول غير صحيحة.';
  if (/already registered|already been registered/i.test(m)) return 'هذا الحساب موجود مسبقاً، سجّل الدخول.';
  if (/Password should be/i.test(m)) return 'كلمة المرور ضعيفة (6 أحرف على الأقل).';
  if (/rate limit/i.test(m)) return 'محاولات كثيرة، انتظر قليلاً ثم أعد المحاولة.';
  if (/network|fetch/i.test(m)) return 'تعذّر الاتصال بالإنترنت.';
  return m || 'حدث خطأ غير متوقع.';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!configured()) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async (uid, retry = true) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (data) setProfile(data);
    else if (retry) setTimeout(() => loadProfile(uid, false), 900);
  }, []);

  const uid = session?.user?.id;
  useEffect(() => {
    if (uid) loadProfile(uid);
    else setProfile(null);
  }, [uid, loadProfile]);

  // ربط جهاز الإشعارات بالمستخدم الحالي
  useEffect(() => {
    if (!ready) return;
    pushEnabled().then((on) => on && registerPush());
  }, [uid, ready]);

  const run = async (fn) => {
    try { await fn(); return null; } catch (e) { return arabicError(e); }
  };

  const signUp = (email, password) =>
    run(async () => {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error('فعّل الدخول المباشر: عطّل "Confirm email" في إعدادات Supabase (انظر README).');
    });

  const value = {
    session, profile, ready,
    user: session?.user || null,
    isOwner: profile?.role === 'owner',
    signUpEmail: (email, password) => {
      if (!validEmail(email)) return Promise.resolve('البريد الإلكتروني غير صحيح.');
      return signUp(email.trim().toLowerCase(), password);
    },
    signUpPhone: (phone, password) => {
      if (!validPhone(phone)) return Promise.resolve('رقم الهاتف غير صحيح.');
      return signUp(toEmail(phone), password);
    },
    signIn: (id, password) => {
      const v = String(id).trim();
      if (!v) return Promise.resolve('أدخل البريد أو رقم الهاتف.');
      if (!v.includes('@') && !validPhone(v)) return Promise.resolve('رقم الهاتف غير صحيح.');
      return run(async () => {
        const { error } = await supabase.auth.signInWithPassword({ email: toEmail(v), password });
        if (error) throw error;
      });
    },
    signOut: async () => {
      await unregisterPush();
      await supabase.auth.signOut();
    },
    changePassword: (oldPw, newPw) =>
      run(async () => {
        const email = session?.user?.email;
        const chk = await supabase.auth.signInWithPassword({ email, password: oldPw });
        if (chk.error) throw new Error('كلمة المرور الحالية غير صحيحة.');
        const { error } = await supabase.auth.updateUser({ password: newPw });
        if (error) throw error;
      }),
    // حذف الحساب نهائياً (لا يمكن فتحه مرة أخرى)
    deleteAccount: () =>
      run(async () => {
        if (profile?.role === 'owner') throw new Error('لا يمكن حذف حساب المالك.');
        await unregisterPush();
        const { error } = await supabase.rpc('delete_my_account');
        if (error) throw error;
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      }),
    updateName: (name) =>
      run(async () => {
        const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', uid);
        if (error) throw error;
        await loadProfile(uid);
      }),
    refreshProfile: () => uid && loadProfile(uid),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
