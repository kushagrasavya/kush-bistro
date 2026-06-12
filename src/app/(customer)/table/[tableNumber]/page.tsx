'use client';

import * as React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';
import MenuItemCard from '@/components/MenuItemCard';
import MenuCategoryList from '@/components/MenuCategoryList';
import CartDrawer from '@/components/CartDrawer';
import { defaultTheme, getThemeStyles } from '@/lib/theme';
import { ShoppingBag, Search, Leaf, UtensilsCrossed, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface TablePageProps {
  params: Promise<{ tableNumber: string }>;
}

// We wrap the main content in a separate component to cleanly handle Next.js useSearchParams
function TableMenuContent({ tableNumber }: { tableNumber: string }) {
  const searchParams = useSearchParams();
  const securityKey = searchParams.get('key');

  const { items, setTableNumber } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // --- LIVE DATABASE STATES ---
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(['All']);
  const [isLoading, setIsLoading] = useState(true);

  // Set table number in cart store
  useEffect(() => {
    if (tableNumber) setTableNumber(tableNumber);
  }, [tableNumber, setTableNumber]);

  // --- LIVE SUPABASE FETCH & REAL-TIME SYNC ---
  useEffect(() => {
    const supabase = createClient();

    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true) // SECURE: Only fetch in-stock items
        .order('category', { ascending: true });

      if (data && !error) {
        // Map database snake_case to frontend camelCase
        const formattedData = data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          category: item.category,
          isVeg: item.is_veg,
          attributes: item.attributes
        }));
        
        setMenuItems(formattedData);
        
        // Dynamically build categories based on what's actually available
        const uniqueCategories = Array.from(new Set(formattedData.map(item => item.category)));
        setDynamicCategories(['All', ...uniqueCategories]);
      }
      setIsLoading(false);
    };

    fetchMenu();

    // The Magic: Listen for any inventory changes from the admin dashboard and instantly re-fetch!
    const channel = supabase
      .channel('public:menu_items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenu();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- SECURITY VALIDATION ---
  // Expects the physical QR code to point to: /table/5?key=KITCHEN_5
  const expectedKey = `KITCHEN_${tableNumber}`;
  const isAuthorized = securityKey === expectedKey;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: '#1e1516', color: '#FAF7EE' }}>
        <ShieldAlert size={48} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-black font-display mb-2">Invalid Table Access</h1>
        <p className="text-zinc-400 text-sm font-medium">Please scan the official QR code located physically on your table to view the menu.</p>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatPrice = (paise: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesVeg = !vegOnly || item.isVeg;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  return (
    <div className="min-h-screen flex flex-col relative pb-28" style={{ backgroundColor: '#FAF7EE' }}>

      {/* Sticky Header */}
      <header
        className="sticky top-0 z-30 h-14 px-4 flex items-center justify-between"
        style={{
          backgroundColor: '#FAF7EE',
          borderBottom: '2.5px solid #1A1A1A',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: '#E07A5F',
              border: '2px solid #1A1A1A',
              boxShadow: '2px 2px 0px #1A1A1A',
            }}
          >
            <UtensilsCrossed size={15} color="#FAF7EE" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-black text-sm text-[#1A1A1A] font-display leading-none">{defaultTheme.name}</h1>
            <span className="text-[10px] font-bold text-[#E07A5F] uppercase tracking-wider">
              Table {tableNumber}
            </span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 rounded-xl cursor-pointer transition-colors hover:bg-[#EAE5D8]"
        >
          <ShoppingBag size={22} color="#1A1A1A" strokeWidth={2.5} />
          <AnimatePresence>
            {totalItems > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center"
                style={{
                  backgroundColor: '#E07A5F',
                  color: '#FAF7EE',
                  border: '2px solid #1A1A1A',
                }}
              >
                {totalItems}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </header>

      {/* Hero Banner */}
      <section className="px-4 pt-6 pb-4">
        <h2
          className="text-3xl font-black tracking-tight text-[#1A1A1A] font-display leading-tight mb-1"
        >
          What are you{' '}
          <span
            className="inline-block px-2 rounded-lg"
            style={{
              backgroundColor: '#F3CC8F',
              border: '2px solid #1A1A1A',
            }}
          >
            craving?
          </span>
        </h2>
        <p className="text-[#5A5245] text-sm font-medium">
          Fresh ingredients, cooked with passion — pick your vibe.
        </p>
      </section>

      {/* Search + Veg Toggle */}
      <div className="px-4 flex flex-col gap-3 mb-1">
        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            color="#5A5245"
            strokeWidth={2.5}
          />
          <input
            type="text"
            placeholder="Search dishes, drinks, snacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full h-11 pl-10 pr-4 text-sm font-semibold text-[#1A1A1A] placeholder:text-[#5A5245]/60 outline-none transition-all"
            style={{
              backgroundColor: '#FFFFFF',
              border: isFocused ? '2.5px solid #E07A5F' : '2.5px solid #1A1A1A',
              borderRadius: '14px',
              boxShadow: isFocused ? '3px 3px 0px #E07A5F' : '3px 3px 0px #1A1A1A',
            }}
          />
        </div>

        {/* Veg Toggle */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #1A1A1A',
            boxShadow: '3px 3px 0px #1A1A1A',
          }}
        >
          <div className="flex items-center gap-2">
            <Leaf size={14} color="#16a34a" strokeWidth={2.5} />
            <span className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider">Veg Only</span>
          </div>
          <motion.button
            onClick={() => setVegOnly(!vegOnly)}
            className="relative w-12 h-6 rounded-full transition-colors cursor-pointer"
            style={{
              backgroundColor: vegOnly ? '#16a34a' : '#EAE5D8',
              border: '2px solid #1A1A1A',
            }}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
              style={{
                border: '1.5px solid #1A1A1A',
                left: vegOnly ? '26px' : '3px',
              }}
            />
          </motion.button>
        </div>
      </div>

      {/* Category Pills */}
      {!isLoading && dynamicCategories.length > 1 && (
        <div className="px-4 sticky top-14 z-20 pb-1 pt-2" style={{ backgroundColor: '#FAF7EE', borderBottom: '2px solid #1A1A1A' }}>
          <MenuCategoryList
            categories={dynamicCategories.map(cat => ({ id: cat, name: cat }))}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      )}

      {/* Menu Grid */}
      <main className="px-4 pt-5 pb-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin mb-4" color="#E07A5F" />
            <p className="font-black text-[#1A1A1A] uppercase tracking-widest text-xs">Loading Menu...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredItems.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center py-16"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: '#EAE5D8', border: '2px solid #1A1A1A', boxShadow: '3px 3px 0px #1A1A1A' }}
            >
              <Search size={26} color="#5A5245" />
            </div>
            <p className="font-black text-[#1A1A1A] text-base mb-1">No dishes found</p>
            <p className="text-[#5A5245] text-xs mb-4">Try a different search or category.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setVegOnly(false); }}
              className="text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer"
              style={{
                backgroundColor: '#E07A5F',
                color: '#FAF7EE',
                border: '2px solid #1A1A1A',
                boxShadow: '3px 3px 0px #1A1A1A',
              }}
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </main>

      {/* Floating Cart Footer */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 px-4 pb-5 pt-2 z-30"
            style={{ backgroundColor: 'transparent' }}
          >
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsCartOpen(true)}
              className="max-w-lg mx-auto h-16 px-5 rounded-2xl flex items-center justify-between cursor-pointer"
              style={{
                backgroundColor: '#E07A5F',
                border: '2.5px solid #1A1A1A',
                boxShadow: '5px 5px 0px 0px #1A1A1A',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center relative flex-shrink-0"
                  style={{ backgroundColor: '#FAF7EE', border: '2px solid #1A1A1A' }}
                >
                  <ShoppingBag size={18} color="#E07A5F" strokeWidth={2.5} />
                  <span
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center"
                    style={{ backgroundColor: '#F3CC8F', color: '#1A1A1A', border: '2px solid #1A1A1A' }}
                  >
                    {totalItems}
                  </span>
                </div>
                <div>
                  <p className="text-[#FAF7EE]/70 text-[10px] font-bold uppercase tracking-wide leading-none">Order Total</p>
                  <p className="font-black text-[#FAF7EE] text-base font-display leading-tight">{formatPrice(totalPrice)}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-[#FAF7EE]">
                View Cart
                <ArrowRight size={16} strokeWidth={3} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}

// Wrapping the component in Suspense to prevent Next.js build errors due to useSearchParams
export default function TablePage({ params }: TablePageProps) {
  const resolvedParams = React.use(params);
  const tableNumber = decodeURIComponent(resolvedParams.tableNumber);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FAF7EE' }}>
        <Loader2 size={32} className="animate-spin text-[#E07A5F]" />
      </div>
    }>
      <TableMenuContent tableNumber={tableNumber} />
    </Suspense>
  );
}