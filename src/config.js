import Constants from 'expo-constants';
import { COLORS } from './theme';

export { COLORS };

// ===== إعداد Supabase: ضع بيانات مشروعك هنا (Project Settings → API) =====
export const SUPABASE = {
  url: 'https://YOUR-PROJECT.supabase.co',
  anonKey: 'YOUR-ANON-KEY',
};
export const configured = () => !SUPABASE.url.includes('YOUR-PROJECT');

export const STORE = {
  name: 'كاستر ستور',
  currency: 'د.ع',
  deliveryFee: 0, // التوصيل مجاني. ضع رقماً أكبر من صفر لتفعيل رسوم التوصيل
  facebook: 'https://www.facebook.com/profile.php?id=61590033001219',
  version: Constants.expoConfig?.version ?? '1.0.0',
};

// حالات الطلب (الألوان تتبع الوضع الفاتح/الداكن)
export const STATUS = {
  pending: { label: 'قيد المراجعة', get color() { return COLORS.amber; }, get bg() { return COLORS.amberBg; } },
  packing: { label: 'قيد التغليف', get color() { return COLORS.primary; }, get bg() { return COLORS.tint; } },
  delivering: { label: 'قيد التوصيل', get color() { return COLORS.blue; }, get bg() { return COLORS.blueBg; } },
  delivered: { label: 'تم التوصيل', get color() { return COLORS.ok; }, get bg() { return COLORS.okBg; } },
  rejected: { label: 'تم الرفض', get color() { return COLORS.danger; }, get bg() { return COLORS.dangerBg; } },
};
export const STATUS_KEYS = Object.keys(STATUS);

export const fmt = (n) => `${Number(n).toLocaleString('en-US')} ${STORE.currency}`;
export const deliveryText = () => (STORE.deliveryFee > 0 ? fmt(STORE.deliveryFee) : 'مجاني');
export const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
export const displayName = (p) =>
  p?.full_name || p?.phone || (p?.email ? p.email.split('@')[0] : '') || 'مستخدم';
