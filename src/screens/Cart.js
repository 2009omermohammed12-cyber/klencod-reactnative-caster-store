import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, STORE, fmt, deliveryText } from '../config';
import { emojiOf } from '../data';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { Btn, Empty } from '../ui';

export default function Cart({ navigation }) {
  useTheme();
  const { items, setQty, subtotal } = useCart();
  const { session } = useAuth();

  const proceed = () => {
    if (!session) navigation.navigate('Auth', { next: 'Checkout' });
    else navigation.navigate('Checkout');
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Text style={s.title}>سلة المشتريات</Text>
      {!items.length ? (
        <Empty icon="🛒" text="سلتك فارغة" action="تصفح المنتجات" onAction={() => navigation.navigate('Home')} />
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(i) => i.product.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const img = (item.product.media || []).find((m) => m.type === 'image');
              return (
                <View style={s.row}>
                  <View style={s.thumb}>
                    {img ? <Image source={{ uri: img.url }} style={{ width: 54, height: 54 }} /> : <Text style={{ fontSize: 30 }}>{emojiOf(item.product.cat)}</Text>}
                  </View>
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <Text style={s.name} numberOfLines={2}>{item.product.name}</Text>
                    <Text style={s.price}>{fmt(item.product.price * item.qty)}</Text>
                  </View>
                  <View style={s.qtyBox}>
                    <TouchableOpacity onPress={() => setQty(item.product.id, item.qty + 1)} style={s.q}><Text style={s.qt}>+</Text></TouchableOpacity>
                    <Text style={{ fontWeight: '800', fontSize: 15 }}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => setQty(item.product.id, item.qty - 1)} style={s.q}><Text style={s.qt}>−</Text></TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
          <View style={s.footer}>
            <View style={s.line}><Text style={s.lbl}>المجموع</Text><Text style={s.v}>{fmt(subtotal)}</Text></View>
            <View style={s.line}><Text style={s.lbl}>التوصيل</Text><Text style={[s.v, STORE.deliveryFee === 0 && { color: COLORS.ok }]}>{deliveryText()}</Text></View>
            <View style={s.line}><Text style={{ fontWeight: '800', color: COLORS.dark }}>الإجمالي</Text><Text style={[s.v, { color: COLORS.primary, fontSize: 18 }]}>{fmt(subtotal + STORE.deliveryFee)}</Text></View>
            {!session ? <Text style={s.hint}>يلزم تسجيل الدخول أو إنشاء حساب لإتمام الشراء.</Text> : null}
            <Btn title="إكمال" onPress={proceed} style={{ marginTop: 10 }} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark, textAlign: 'right', paddingHorizontal: 16, paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 10, marginBottom: 10 },
  thumb: { width: 54, height: 54, borderRadius: 10, backgroundColor: COLORS.tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  name: { textAlign: 'right', fontWeight: '600', color: COLORS.dark },
  price: { textAlign: 'right', color: COLORS.primary, fontWeight: '700', marginTop: 4 },
  qtyBox: { alignItems: 'center', gap: 4 },
  q: { backgroundColor: COLORS.tint, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  qt: { color: COLORS.primary, fontSize: 18, fontWeight: '800' },
  footer: { backgroundColor: COLORS.card, padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: COLORS.line },
  line: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  v: { fontWeight: '700', color: COLORS.dark },
  lbl: { color: COLORS.dark },
  hint: { color: COLORS.muted, textAlign: 'right', fontSize: 12.5, marginTop: 6 },
}));
