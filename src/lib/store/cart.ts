import { create } from 'zustand';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number; // in paise (smallest unit)
  quantity: number;
  image?: string;
  customizations?: Record<string, unknown>;
}

interface CartState {
  items: CartItem[];
  tableNumber: string;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void; // Removes item completely
  decrementItem: (menuItemId: string) => void; // Decrements quantity by 1, or removes if quantity becomes 0
  clearCart: () => void;
  setTableNumber: (tableNumber: string) => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  tableNumber: '',
  addItem: (item) =>
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (i) => i.menuItemId === item.menuItemId
      );
      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += item.quantity;
        return { items: newItems };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (menuItemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.menuItemId !== menuItemId),
    })),
  decrementItem: (menuItemId) =>
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (i) => i.menuItemId === menuItemId
      );
      if (existingItemIndex > -1) {
        const item = state.items[existingItemIndex];
        if (item.quantity > 1) {
          const newItems = [...state.items];
          newItems[existingItemIndex].quantity -= 1;
          return { items: newItems };
        } else {
          return { items: state.items.filter((i) => i.menuItemId !== menuItemId) };
        }
      }
      return {};
    }),
  clearCart: () => set({ items: [] }),
  setTableNumber: (tableNumber) => set({ tableNumber }),
}));
