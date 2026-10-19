import React, { useState } from 'react';
import { View, Text, FlatList, Image, Switch, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { COLORS, fmt } from '../config';
import { emojiOf } from '../data';
import { supabase } from '../supabase';
import { useProducts } from '../ProductsContext';
import { Btn, Empty } from '../ui';

export default function ManageProducts({ navigation }) {
  useTheme();
  const { all, reload } = useProducts();
  const [busy, setBusy] = useState(null);

  const toggle = async (p, active) => {
    setBusy(p.id);
    await supabase.from('products').update({ active }).eq('id', p.id);
    await reload();
    setBusy(null);
  };
  const remove = (p) =>
    Alert.alert('حذف المنتج', `حذف «${p.name}» نهائياً؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await supabase.from('products').delete().eq('id', p.id); reload(); } },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={s.bar}><Btn title="+ إضافة منتج" onPress={() => navigation.navigate('ProductEditor', {})} /></View>
      <FlatList
        data={all}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 12, paddingBottom: 30 }}
        ListEmptyComponent={<Empty icon="🛍️" text="لا توجد منتجات. اضغط «إضافة منتج» للبدء." />}
        renderItem={({ item: p }) => {
          const img = p.media.find((m) => m.type === 'image');
          return (
            <View style={[s.row, !p.active && { opacity: 0.55 }]}>
              <View style={s.thumb}>{img ? <Image source={{ uri: img.url }} style={{ width: 56, height: 56 }} /> : <Text style={{ fontSize: 28 }}>{emojiOf(p.cat)}</Text>}</View>
              <TouchableOpacity style={{ flex: 1, marginHorizontal: 10 }} onPress={() => navigation.navigate('ProductEditor', { id: p.id })}>
                <Text style={s.name} numberOfLines={1}>{p.name}</Text>
                <Text style={s.sub}>{fmt(p.price)} • {p.media.length} وسائط</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Switch value={p.active} disabled={busy === p.id} onValueChange={(v) => toggle(p, v)} trackColor={{ true: COLORS.primary }} />
                <TouchableOpacity onPress={() => remove(p)}><Text style={{ color: COLORS.danger, fontSize: 12 }}>حذف</Text></TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = themed(() => ({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 10, marginBottom: 10 },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: COLORS.tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  name: { textAlign: 'right', fontWeight: '700', color: COLORS.dark },
  sub: { textAlign: 'right', color: COLORS.muted, marginTop: 3, fontSize: 12.5 },
  bar: { padding: 12, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.line },
}));
