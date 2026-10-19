import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../config';
import { CATEGORIES } from '../data';
import { useProducts } from '../ProductsContext';

export default function Categories({ navigation }) {
  useTheme();
  const { productsOf } = useProducts();
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <Text style={s.title}>جميع الأقسام</Text>
      <FlatList
        data={CATEGORIES}
        numColumns={2}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 10, paddingBottom: 30 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('Category', { id: item.id })} activeOpacity={0.85}>
            <Text style={{ fontSize: 38 }}>{item.emoji}</Text>
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.count}>{productsOf(item.id).length} منتج</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const s = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark, textAlign: 'right', paddingHorizontal: 16, paddingVertical: 12 },
  card: { flex: 1, margin: 6, backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.line, padding: 14, alignItems: 'center', minHeight: 120, justifyContent: 'center' },
  name: { marginTop: 8, fontWeight: '700', color: COLORS.dark, textAlign: 'center', fontSize: 13 },
  count: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
}));
