import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);
const KEY = 'caster_cart_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{product, qty}]

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v && setItems(JSON.parse(v))).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const add = (product) =>
    setItems((cur) => {
      const f = cur.find((i) => i.product.id === product.id);
      return f
        ? cur.map((i) => (i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...cur, { product, qty: 1 }];
    });

  const setQty = (id, qty) =>
    setItems((cur) =>
      qty <= 0
        ? cur.filter((i) => i.product.id !== id)
        : cur.map((i) => (i.product.id === id ? { ...i, qty } : i))
    );

  const clear = () => setItems([]);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.qty * i.product.price, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
