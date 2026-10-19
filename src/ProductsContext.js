import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './supabase';
import { configured } from './config';
import { PRODUCTS as SAMPLE } from './data';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);
const DAY = 86400000;

const fromRow = (r) => ({
  id: r.id,
  cat: r.category,
  name: r.name,
  desc: r.description || '',
  price: Number(r.price),
  oldPrice: r.old_price ? Number(r.old_price) : null,
  media: r.media || [],
  links: r.links || [],
  featured: !!r.featured,
  active: r.active !== false,
  isNew: Date.now() - new Date(r.created_at).getTime() < 30 * DAY,
});

const fromSample = (p) => ({
  id: p.id, cat: p.cat, name: p.name, desc: p.desc, price: p.price, oldPrice: p.oldPrice,
  media: [], links: [], featured: p.tags.includes('best'), active: true, isNew: p.tags.includes('new'),
});

export function ProductsProvider({ children }) {
  const { isOwner } = useAuth();
  const [all, setAll] = useState(configured() ? [] : SAMPLE.map(fromSample));
  const [loading, setLoading] = useState(configured());

  const load = useCallback(async () => {
    if (!configured()) return;
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) setAll(data.map(fromRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    if (!configured()) return;
    const ch = supabase.channel('products-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const products = useMemo(() => (isOwner ? all : all.filter((p) => p.active)), [all, isOwner]);

  const productsOf = useCallback(
    (catId) =>
      products.filter((p) => {
        if (!p.active) return false;
        if (catId === 'best') return p.featured;
        if (catId === 'offers') return !!p.oldPrice;
        if (catId === 'new') return p.isNew;
        return p.cat === catId;
      }),
    [products]
  );

  return <Ctx.Provider value={{ products, all, loading, reload: load, productsOf }}>{children}</Ctx.Provider>;
}

export const useProducts = () => useContext(Ctx);
