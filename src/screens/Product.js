import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Linking, useWindowDimensions, StyleSheet } from 'react-native';
import { themed, useTheme } from '../theme';
import { Video, ResizeMode } from 'expo-av';
import { COLORS, fmt } from '../config';
import { CATEGORIES, emojiOf } from '../data';
import { useCart } from '../CartContext';
import { useProducts } from '../ProductsContext';
import { useAuth } from '../AuthContext';
import { Btn } from '../ui';

export default function Product({ route, navigation }) {
  useTheme();
  const { add } = useCart();
  const { all } = useProducts();
  const { isOwner } = useAuth();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const p = all.find((x) => x.id === route.params.id);
  if (!p) return null;
  const cat = CATEGORIES.find((c) => c.id === p.cat);
  const media = p.media || [];

  return (
    <View style={s.root}>
      <ScrollView>
        {media.length ? (
          <View>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
              {media.map((m, i) =>
                m.type === 'video' ? (
                  <Video key={i} source={{ uri: m.url }} style={{ width, height: 300, backgroundColor: '#000' }} useNativeControls resizeMode={ResizeMode.CONTAIN} />
                ) : (
                  <Image key={i} source={{ uri: m.url }} style={{ width, height: 300, backgroundColor: COLORS.tint }} resizeMode="cover" />
                )
              )}
            </ScrollView>
            {media.length > 1 && <Text style={s.pager}>{page + 1} / {media.length}</Text>}
          </View>
        ) : (
          <View style={s.big}><Text style={{ fontSize: 110 }}>{emojiOf(p.cat)}</Text></View>
        )}

        <View style={s.body}>
          <Text style={s.cat}>{cat?.name}</Text>
          <Text style={s.name}>{p.name}</Text>
          <Text style={s.price}>{fmt(p.price)}</Text>
          {p.oldPrice ? <Text style={s.old}>{fmt(p.oldPrice)}</Text> : null}
          {p.desc ? (<><Text style={s.h}>الوصف</Text><Text style={s.desc}>{p.desc}</Text></>) : null}

          {p.links?.length ? (
            <>
              <Text style={s.h}>روابط</Text>
              {p.links.map((l, i) => (
                <TouchableOpacity key={i} style={s.link} onPress={() => Linking.openURL(l.url).catch(() => {})}>
                  <Text style={s.linkTxt}>🔗 {l.title || l.url}</Text>
                </TouchableOpacity>
              ))}
            </>
          ) : null}

          <Text style={s.cod}>💵 الدفع عند الاستلام • 🚚 توصيل مجاني</Text>
          <Text style={s.swap}>🔄 استبدال بنفس المنتج فقط عند وجود عيب، خلال يومين من الاستلام (لا يوجد إرجاع، ولا استبدال في اليوم الثالث)</Text>
          {isOwner ? <Btn kind="ghost" title="تعديل المنتج" style={{ marginTop: 12 }} onPress={() => navigation.navigate('ProductEditor', { id: p.id })} /> : null}
        </View>
      </ScrollView>

      <View style={s.bar}>
        <Btn style={{ flex: 1 }} title="أضف للسلة واذهب للدفع" onPress={() => { add(p); navigation.navigate('Tabs', { screen: 'Cart' }); }} />
        <Btn kind="ghost" title="+ سلة" style={{ paddingHorizontal: 18 }} onPress={() => add(p)} />
      </View>
    </View>
  );
}

const s = themed(() => ({
  root: { flex: 1, backgroundColor: COLORS.bg },
  big: { height: 260, backgroundColor: COLORS.tint, alignItems: 'center', justifyContent: 'center' },
  pager: { position: 'absolute', bottom: 10, left: 12, backgroundColor: '#0009', color: '#fff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: 'hidden', fontSize: 12 },
  body: { padding: 18 },
  cat: { color: COLORS.muted, textAlign: 'right' },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.dark, textAlign: 'right', marginTop: 4 },
  price: { fontSize: 22, color: COLORS.primary, fontWeight: '800', textAlign: 'right', marginTop: 10 },
  old: { color: COLORS.muted, textDecorationLine: 'line-through', textAlign: 'right' },
  h: { fontSize: 16, fontWeight: '700', textAlign: 'right', marginTop: 18, color: COLORS.dark },
  desc: { color: COLORS.dark, textAlign: 'right', marginTop: 6, lineHeight: 24 },
  link: { backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.line, padding: 12, marginTop: 8 },
  linkTxt: { color: COLORS.primary, textAlign: 'right', fontWeight: '600' },
  cod: { marginTop: 18, color: COLORS.primary, textAlign: 'right', fontWeight: '600' },
  swap: { marginTop: 8, color: COLORS.muted, textAlign: 'right', lineHeight: 22 },
  bar: { flexDirection: 'row', padding: 12, backgroundColor: COLORS.card, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.line },
}));
