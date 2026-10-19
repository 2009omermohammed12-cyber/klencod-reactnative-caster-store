import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { themed } from './theme';
import { COLORS } from './config';

export function Btn({ title, onPress, kind = 'primary', loading, disabled, style }) {
  const ghost = kind === 'ghost';
  const danger = kind === 'danger';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        s.btn,
        ghost && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.primary },
        danger && { backgroundColor: COLORS.danger },
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={ghost ? COLORS.primary : COLORS.onPrimary} />
      ) : (
        <Text style={[s.btnTxt, ghost && { color: COLORS.primary }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Field({ label, multiline, style, ...p }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={COLORS.muted}
        textAlign="right"
        multiline={multiline}
        {...p}
        style={[s.input, multiline && { minHeight: 90, textAlignVertical: 'top' }, style]}
      />
    </View>
  );
}

export function Chip({ label, on, onPress, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, on && { backgroundColor: color || COLORS.primary, borderColor: color || COLORS.primary }]}>
      <Text style={[s.chipTxt, on && { color: COLORS.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Empty({ icon = '🛒', text, action, onAction }) {
  return (
    <View style={s.empty}>
      <Text style={{ fontSize: 54 }}>{icon}</Text>
      <Text style={s.emptyTxt}>{text}</Text>
      {action ? <Btn title={action} onPress={onAction} style={{ marginTop: 14, paddingHorizontal: 26 }} /> : null}
    </View>
  );
}

export function Avatar({ name = '?', size = 46 }) {
  const colors = ['#6C3FE0', '#1D6FB8', '#1E8E5A', '#C2410C', '#B7287A', '#0F766E'];
  const c = colors[(name.charCodeAt(0) || 0) % colors.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

const s = themed(() => ({
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: COLORS.onPrimary, fontWeight: '800', fontSize: 15 },
  label: { textAlign: 'right', color: COLORS.dark, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, padding: 12, fontSize: 15, color: COLORS.dark },
  chip: { backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 13, paddingVertical: 7 },
  chipTxt: { color: COLORS.dark, fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTxt: { color: COLORS.muted, marginTop: 10, textAlign: 'center' },
}));
