import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LIGHT = {
  primary: '#6C3FE0', onPrimary: '#FFFFFF', dark: '#1F1B2E', bg: '#F6F5FA', card: '#FFFFFF',
  muted: '#7A7690', line: '#E6E2F1', tint: '#EFEAFB',
  danger: '#E5484D', dangerBg: '#FDE4E5', dangerInk: '#C0262B',
  ok: '#1E8E5A', okBg: '#DFF5EA', amber: '#B7791F', amberBg: '#FFF4D6',
  blue: '#1D6FB8', blueBg: '#E1F0FF', accent: '#FFB020',
};
const DARK = {
  primary: '#9B7BFF', onPrimary: '#14111F', dark: '#F0EDF9', bg: '#14111F', card: '#1E1A2D',
  muted: '#A39EBB', line: '#2E2945', tint: '#2A2342',
  danger: '#FF6A6E', dangerBg: '#3A1D22', dangerInk: '#FF8A8E',
  ok: '#4CC38A', okBg: '#16322A', amber: '#F2B85B', amberBg: '#3A2D12',
  blue: '#6DB4F5', blueBg: '#132B42', accent: '#FFB020',
};

// لون النص الافتراضي يتبع الوضع (حتى لا تظهر نصوص سوداء على خلفية داكنة)
try {
  const origRender = Text.render;
  if (typeof origRender === 'function' && !Text.__themed) {
    Text.__themed = true;
    Text.render = function (...args) {
      const el = origRender.apply(this, args);
      return React.cloneElement(el, { style: [{ color: COLORS.dark }, el.props.style] });
    };
  }
} catch (e) {}

// كائن الألوان الحالي. يتغير عند تبديل الوضع، والشاشات تعيد الرسم عبر useTheme().
export const COLORS = { ...LIGHT };
let version = 0;

export function applyTheme(scheme) {
  Object.assign(COLORS, scheme === 'dark' ? DARK : LIGHT);
  version++;
}

// بديل StyleSheet.create يُعاد حسابه عند تغيّر الوضع
export function themed(factory) {
  let v = -1;
  let cache = {};
  return new Proxy({}, {
    get(_, key) {
      if (v !== version) { cache = StyleSheet.create(factory()); v = version; }
      return cache[key];
    },
  });
}

const Ctx = createContext({ mode: 'system', scheme: 'light', setMode: () => {} });

export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState('system'); // system | light | dark
  const [ready, setReady] = useState(false);
  const applied = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('theme_mode')
      .then((v) => { if (v === 'light' || v === 'dark' || v === 'system') setModeState(v); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  if (applied.current !== scheme) { applyTheme(scheme); applied.current = scheme; }

  const setMode = (m) => {
    setModeState(m);
    AsyncStorage.setItem('theme_mode', m).catch(() => {});
  };

  if (!ready) return null;
  return <Ctx.Provider value={{ mode, scheme, setMode }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
