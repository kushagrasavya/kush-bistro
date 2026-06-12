'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Star, Leaf, Drumstick } from 'lucide-react';
import { MenuItem } from '@/lib/validations';
import { useCartStore } from '@/lib/store/cart';

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { items, addItem, decrementItem } = useCartStore();

  const cartItem = items.find((i) => i.menuItemId === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    });
  };

  const formatPrice = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const isRecommended = !!(item.attributes && (item.attributes as Record<string, unknown>).recommended);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, boxShadow: '6px 6px 0px 0px #1A1A1A' }}
      transition={{ duration: 0.2, ease: [0.175, 0.885, 0.32, 1.275] }}
      className="bg-white flex flex-col h-full overflow-hidden cursor-default"
      style={{
        border: '2.5px solid #1A1A1A',
        borderRadius: '20px',
        boxShadow: '4px 4px 0px 0px #1A1A1A',
      }}
    >
      {/* Image */}
      <div className="relative h-44 w-full bg-[#EAE5D8] overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />

        {/* Recommended Badge */}
        {isRecommended && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
            style={{
              backgroundColor: '#F3CC8F',
              border: '2px solid #1A1A1A',
              boxShadow: '2px 2px 0px #1A1A1A',
              color: '#1A1A1A',
            }}
          >
            <Star size={9} className="fill-current" />
            Chef's Pick
          </div>
        )}

        {/* Veg / Non-Veg Tag */}
        <div
          className="absolute top-3 right-3 p-1.5 rounded-xl"
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #1A1A1A',
            boxShadow: '2px 2px 0px #1A1A1A',
          }}
        >
          {item.isVeg ? (
            <Leaf size={12} color="#16a34a" strokeWidth={2.5} />
          ) : (
            <Drumstick size={12} color="#e11d48" strokeWidth={2.5} />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <span
          className="text-[10px] font-black uppercase tracking-widest mb-1"
          style={{ color: '#E07A5F' }}
        >
          {item.category}
        </span>
        <h3 className="font-black text-base leading-snug line-clamp-1 text-[#1A1A1A] font-display mb-1">
          {item.name}
        </h3>
        <p className="text-[#5A5245] text-xs leading-relaxed flex-1 line-clamp-2 mb-3">
          {item.description}
        </p>

        {/* Price + Add Button */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '2px solid #EAE5D8' }}>
          <span className="font-black text-xl text-[#1A1A1A] font-display tracking-tight">
            {formatPrice(item.price)}
          </span>

          <AnimatePresence mode="wait">
            {quantity > 0 ? (
              <motion.div
                key="counter"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex items-center overflow-hidden"
                style={{
                  border: '2px solid #1A1A1A',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0px #1A1A1A',
                  backgroundColor: '#E07A5F',
                }}
              >
                <button
                  onClick={() => decrementItem(item.id)}
                  className="px-2.5 py-2 hover:bg-black/10 transition-colors cursor-pointer flex items-center"
                >
                  <Minus size={13} color="#FAF7EE" strokeWidth={3} />
                </button>
                <span className="px-1 text-sm font-black text-[#FAF7EE] min-w-[20px] text-center select-none">
                  {quantity}
                </span>
                <button
                  onClick={handleAdd}
                  className="px-2.5 py-2 hover:bg-black/10 transition-colors cursor-pointer flex items-center"
                >
                  <Plus size={13} color="#FAF7EE" strokeWidth={3} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={{ scale: 0.93 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={handleAdd}
                className="flex items-center gap-1 px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer transition-all"
                style={{
                  backgroundColor: '#FAF7EE',
                  color: '#E07A5F',
                  border: '2px solid #E07A5F',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0px #E07A5F',
                }}
              >
                <Plus size={13} strokeWidth={3} />
                ADD
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
