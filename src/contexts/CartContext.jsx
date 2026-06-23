import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addToCart = useCallback((dish) => {
    setItems(prev => {
      const existing = prev.find(i => i.dish_id === dish.id);
      if (existing) {
        return prev.map(i =>
          i.dish_id === dish.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        dish_id:   dish.id,
        name:      dish.name,
        price:     Number(dish.price),
        photo_url: dish.photo_url ?? null,
        quantity:  1,
      }];
    });
  }, []);

  const removeFromCart = useCallback((dish_id) => {
    setItems(prev => prev.filter(i => i.dish_id !== dish_id));
  }, []);

  const updateQuantity = useCallback((dish_id, qty) => {
    const quantity = Math.max(0, Math.floor(qty));
    if (quantity === 0) {
      setItems(prev => prev.filter(i => i.dish_id !== dish_id));
    } else {
      setItems(prev =>
        prev.map(i => i.dish_id === dish_id ? { ...i, quantity } : i)
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart должен использоваться внутри CartProvider');
  }
  return context;
}