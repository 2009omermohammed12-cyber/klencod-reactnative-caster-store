import React, { useState } from 'react';
import { View, Text, Image, TextInput, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, STORE } from '../config';
import { CATEGORIES } from '../data';
import { ProductCard } from '../ProductCard';
import { useCart } from '../CartContext';
import { useProducts } from '../ProductsContext';
import { useNotifs } from '../NotifContext';

export default function Home({ navigation }) {
  useTheme();
  const [q, setQ] = useState('');
  const { add } = useCart();
  const { products, productsOf, loading } = useProducts();
  const { unread } = useNotifs();

  const featured = [...new Map([...productsOf('best'), ...productsOf('offers')].map((p) => [p.id, p])).values()];
  const list = q.trim() ? products.filter((p) => p.name.includes(q.trim())) : (featured.length ? featured : products);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={s.logoBox}><Image source={require('../../assets/logo-mark.png')} style={{ width: 34, height: 21 }} resizeMode="contain" /></View>
          <Text style={s.title}>{STORE.name}</Text>
        </View>
        <TouchableOpacity style={s.bell} onPress={() => navigation.navigate('Notifications')} accessibilityLabel="الإشعارات">
          <Text style={{ fontSize: 22 }}>🔔</Text>
          {unread > 0 && <Text style={s.badge}>{unread > 9 ? '9+' : unread}</Text>}
        </TouchableOpacity>
      </View>

      <TextInput style={s.search} placeholder="ابحث عن منتج..." placeholderTextColor={COLORS.muted} value={q} onChangeText={setQ} textAlign="right" />

      <FlatList
        data={list}
        numColumns={2}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 30 }}
        ListHeaderComponent={
          q.trim() ? null : (
            <View>
              <View style={s.ship}>
                <View style={s.shipIcon}><Text style={{ fontSize: 26 }}>🚚</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.shipTitle}>توصيل مجاني</Text>
                  <Text style={s.shipSub}>لجميع المحافظات • الدفع عند الاستلام</Text>
                </View>
                <Text style={s.shipPill}>مجاناً</Text>
              </View>
              <Text style={s.section}>الأقسام</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6 }}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c.id} style={s.cat} onPress={() => navigation.navigate('Category', { id: c.id })}>
                    <Text style={{ fontSize: 28 }}>{c.emoji}</Text>
                    <Text style={s.catTxt} numberOfLines={2}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={s.section}>الأكثر مبيعاً وعروض خاصة</Text>
            </View>
          )
        }
        ListEmptyComponent={loading ? <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.primary} /> : <Text style={s.empty}>لا توجد منتجات بعد</Text>}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('Product', { id: item.id })} onAdd={() => add(item)} />
        )}
      />
    </SafeAreaView>
  );
}

const s = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  bell: { padding: 6 },
  logoBox: { backgroundColor: '#F5F1E5', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 5 },
  badge: { position: 'absolute', top: 0, left: 0, backgroundColor: COLORS.danger, color: '#fff', fontSize: 11, minWidth: 18, textAlign: 'center', borderRadius: 9, overflow: 'hidden', fontWeight: '700' },
  search: { color: COLORS.dark, backgroundColor: COLORS.card, marginHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 6, fontSize: 15 },
  section: { fontSize: 17, fontWeight: '700', color: COLORS.dark, textAlign: 'right', marginHorizontal: 10, marginVertical: 10 },
  cat: { width: 92, alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 10, marginHorizontal: 4 },
  catTxt: { fontSize: 11, color: COLORS.dark, textAlign: 'center', marginTop: 4 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
  ship: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.primary, borderRadius: 16, padding: 14, marginHorizontal: 6, marginTop: 4 },
  shipIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  shipTitle: { color: COLORS.onPrimary, fontWeight: '800', fontSize: 17, textAlign: 'right' },
  shipSub: { color: COLORS.onPrimary, opacity: 0.85, fontSize: 12.5, textAlign: 'right', marginTop: 2 },
  shipPill: { backgroundColor: COLORS.onPrimary, color: COLORS.primary, fontWeight: '800', fontSize: 12.5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden' },
}));
