import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { themed } from './theme';
import { COLORS, fmt } from './config';
import { emojiOf } from './data';

export function ProductCard({ product, onPress, onAdd }) {
  const img = (product.media || []).find((m) => m.type === 'image');
  const hasVideo = (product.media || []).some((m) => m.type === 'video');
  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={s.img}>
        {img ? (
          <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 44 }}>{emojiOf(product.cat)}</Text>
        )}
        {product.oldPrice ? <Text style={s.badge}>عرض</Text> : null}
        {hasVideo ? <Text style={s.video}>▶</Text> : null}
      </View>
      <Text style={s.name} numberOfLines={2}>{product.name}</Text>
      <Text style={s.price}>{fmt(product.price)}</Text>
      <Text style={s.old}>{product.oldPrice ? fmt(product.oldPrice) : ' '}</Text>
      <TouchableOpacity style={s.add} onPress={onAdd}>
        <Text style={s.addTxt}>+ أضف للسلة</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = themed(() => ({
  card: { flex: 1, margin: 6, backgroundColor: COLORS.card, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: COLORS.line },
  img: { height: 110, borderRadius: 10, backgroundColor: COLORS.tint, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: COLORS.danger, color: '#fff', fontSize: 11, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  video: { position: 'absolute', bottom: 6, left: 6, backgroundColor: '#0008', color: '#fff', fontSize: 11, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  name: { marginTop: 8, fontSize: 14, fontWeight: '600', color: COLORS.dark, textAlign: 'right', minHeight: 36 },
  price: { color: COLORS.primary, fontWeight: '800', textAlign: 'right', marginTop: 4 },
  old: { color: COLORS.muted, textDecorationLine: 'line-through', fontSize: 12, textAlign: 'right' },
  add: { marginTop: 8, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  addTxt: { color: COLORS.onPrimary, fontWeight: '700', fontSize: 13 },
}));
