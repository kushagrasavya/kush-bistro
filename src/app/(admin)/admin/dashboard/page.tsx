'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, CheckSquare, ClipboardList,
  Volume2, VolumeX, Plus, TrendingUp, Clock,
  Loader2, Wifi, WifiOff, ReceiptText, AlertTriangle, X, Trash2
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DbOrder, OrderStatus } from '@/lib/supabase/types';
import { updateOrderStatus, toggleMenuItemAvailability, clearTableBill, clearAllDrafts } from '../actions';
import { mockMenuItems } from '@/lib/mockData';
import { defaultTheme } from '@/lib/theme';

// --- Helpers ---
const formatPrice = (paise: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(paise / 100);

const timeAgo = (iso: string | number) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const MOCK_MENU_MAP = Object.fromEntries(mockMenuItems.map(i => [i.id, i.name]));

// --- Kanban Config ---
const COLUMNS = [
  { id: 'pending',   label: 'New Orders',     color: 'text-amber-400',   borderColor: '#f59e0b', icon: Clock },
  { id: 'preparing', label: 'Preparing',      color: 'text-blue-400',    borderColor: '#60a5fa', icon: ChefHat },
  { id: 'payment',   label: 'Payment',        color: 'text-emerald-400', borderColor: '#34d399', icon: ReceiptText },
  { id: 'completed', label: 'Drafts (Last 10)', color: 'text-zinc-500',  borderColor: '#3f3f46', icon: ClipboardList },
] as const;

// --- INDIVIDUAL KITCHEN TICKET (Cols 1 & 2) ---
function OrderCard({ order, isNew, onStatusChange, isMutating }: { order: DbOrder; isNew: boolean; onStatusChange: (id: string, status: OrderStatus) => void; isMutating: boolean; }) {
  let nextStatus: OrderStatus | null = null;
  let btnLabel = '';
  let btnColor = '';

  if (order.status === 'pending') {
    nextStatus = 'preparing'; btnLabel = 'Start Cooking'; btnColor = '#f59e0b';
  } else if (order.status === 'preparing') {
    nextStatus = 'served'; btnLabel = 'Mark Served'; btnColor = '#60a5fa';
  }

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
      className={`p-4 rounded-2xl flex flex-col gap-3 text-[#FAF7EE] ${isNew ? 'pulse-attention' : ''}`}
      style={{ backgroundColor: '#2d1f21', border: '2px solid rgba(250,247,238,0.08)' }}
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div>
          <span className="text-xl font-black font-display text-[#F3CC8F]">Table {order.table_number}</span>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{timeAgo(order.created_at)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-start text-sm">
            <span className="text-zinc-300 font-bold leading-tight pr-2">
              <span className="text-[#E07A5F] mr-1.5">{item.quantity}x</span> 
              {MOCK_MENU_MAP[item.menuItemId] || (item as any).name || 'Item'}
            </span>
          </div>
        ))}
      </div>

      {nextStatus && (
        <div className="pt-2 mt-1">
          <button
            onClick={() => onStatusChange(order.id, nextStatus as OrderStatus)}
            disabled={isMutating}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black cursor-pointer transition-all disabled:opacity-40"
            style={{ backgroundColor: btnColor, color: '#1A1A1A', border: '2px solid #1A1A1A', boxShadow: '3px 3px 0px #1A1A1A' }}
          >
            {isMutating ? <Loader2 size={12} className="animate-spin" /> : null}
            {btnLabel}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// --- CONSOLIDATED MASTER BILL (Col 3) ---
function TablePaymentCard({ table, orders, onClear, isClearing }: { table: string; orders: DbOrder[]; onClear: (t: string) => void; isClearing: boolean; }) {
  const tableOrders = orders.filter(o => o.table_number === table && o.payment_status === 'pending');
  const allItems = tableOrders.flatMap(o => o.items);
  const totalBill = tableOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const isStillCooking = tableOrders.some(o => o.status === 'pending' || o.status === 'preparing');
  const submittedUtr = tableOrders.find(o => o.payment_id)?.payment_id;

  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden"
      style={{ backgroundColor: '#FAF7EE', border: '3px solid #1A1A1A', boxShadow: '4px 4px 0px #1A1A1A' }}
    >
      <div className="flex items-center justify-between border-b-2 border-[#1A1A1A]/10 pb-3">
        <h3 className="text-2xl font-black font-display text-[#1A1A1A]">Table {table}</h3>
        <span className="text-xs font-black px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-widest">
          Final Bill
        </span>
      </div>

      {submittedUtr && (
        <div className="bg-amber-100 border-2 border-amber-400 text-amber-900 p-3 rounded-xl mt-1 flex flex-col items-center text-center">
          <span className="text-[10px] font-black uppercase tracking-widest mb-1 text-amber-700">Customer Paid via UPI</span>
          <span className="text-lg font-mono font-black">{submittedUtr}</span>
        </div>
      )}

      <div className="flex flex-col gap-2 my-1">
        {allItems.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-[#1A1A1A]">
            <span className="font-bold text-sm line-clamp-1 pr-2">
              <span className="text-[#E07A5F] mr-1.5">{item.quantity}x</span>
              {MOCK_MENU_MAP[item.menuItemId] || (item as any).name || 'Menu Item'}
            </span>
            <span className="font-black text-sm whitespace-nowrap">{formatPrice((item.priceAtOrder || 0) * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-[#1A1A1A] pt-3 mt-1 flex justify-between items-center mb-3">
        <span className="text-xs font-black uppercase tracking-widest text-[#5A5245]">Total</span>
        <span className="text-3xl font-black font-display text-[#E07A5F]">{formatPrice(totalBill)}</span>
      </div>

      {isStillCooking && (
        <div className="flex items-center gap-1.5 p-2 mb-2 rounded-lg bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
          <AlertTriangle size={12} /> Items still in kitchen
        </div>
      )}

      <button
        onClick={() => onClear(table)}
        disabled={isClearing}
        className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        style={{ backgroundColor: '#16a34a', color: '#FAF7EE', border: '2.5px solid #1A1A1A', boxShadow: '3px 3px 0px #1A1A1A' }}
      >
        {isClearing ? <Loader2 size={16} className="animate-spin" /> : <><CheckSquare size={16} /> Confirm Payment</>}
      </button>
    </motion.div>
  );
}

// --- CONSOLIDATED DRAFT RECEIPT (Col 4) ---
function TableDraftCard({ table, latestTime, total, items }: { table: string; latestTime: number; total: number; items: any[] }) {
  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-2xl flex flex-col gap-2 relative overflow-hidden"
      style={{ backgroundColor: '#2d1f21', border: '2px dashed rgba(250,247,238,0.2)' }}
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div>
          <span className="text-lg font-black font-display text-[#FAF7EE]">Table {table}</span>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{timeAgo(latestTime)}</p>
        </div>
        <span className="text-[9px] font-black px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase tracking-widest">
          Archived
        </span>
      </div>
      <div className="flex flex-col gap-1 py-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs text-zinc-400">
            <span>{item.quantity}x {MOCK_MENU_MAP[item.menuItemId] || (item as any).name || 'Item'}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-white/10">
        <span className="text-xs font-black uppercase text-zinc-500">Paid</span>
        <span className="text-base font-black text-emerald-500">{formatPrice(total)}</span>
      </div>
    </motion.div>
  );
}

// --- Main Dashboard ---
export default function AdminDashboard() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [inventory, setInventory] = useState<typeof mockMenuItems>(mockMenuItems);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [clearingTableId, setClearingTableId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isClearingDrafts, startClearingDrafts] = useTransition();

  const supabase = createClient();

  const playChime = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const play = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.35, start); gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(start); osc.stop(start + dur);
      };
      const now = ctx.currentTime;
      play(523.25, now, 0.3); play(659.25, now + 0.18, 0.4); play(783.99, now + 0.36, 0.6);
    } catch { }
  }, [isMuted]);

  useEffect(() => {
    let mounted = true;
    const loadOrders = async () => {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
      if (!error && data && mounted) setOrders(data as DbOrder[]);
    };
    loadOrders();

    const channel = supabase.channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        if (!mounted) return;
        const newOrder = payload.new as DbOrder;
        setOrders(prev => [newOrder, ...prev]);
        setNewOrderIds(prev => new Set([...prev, newOrder.id]));
        setTimeout(() => setNewOrderIds(prev => { const s = new Set(prev); s.delete(newOrder.id); return s; }), 8000);
        playChime();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        if (!mounted) return;
        const updated = payload.new as DbOrder;
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
      })
      .subscribe((status) => setIsConnected(status === 'SUBSCRIBED'));

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [playChime]);

  const handleStatusChange = useCallback((orderId: string, newStatus: OrderStatus) => {
    setMutatingId(orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    startTransition(async () => {
      await updateOrderStatus(orderId, newStatus);
      setMutatingId(null);
    });
  }, []);

  const handleClearTable = useCallback((table: string) => {
    setClearingTableId(table);
    setOrders(prev => prev.map(o => o.table_number === table && o.payment_status === 'pending' ? { ...o, payment_status: 'paid', status: 'completed' } : o));
    startTransition(async () => {
      await clearTableBill(table);
      setClearingTableId(null);
    });
  }, []);

  const handleClearAllDrafts = () => {
    if (confirm("Are you sure? This will wipe all completed tickets from the board and the database.")) {
      startClearingDrafts(async () => {
        setOrders(prev => prev.filter(o => o.status !== 'completed' && o.status !== 'cancelled'));
        await clearAllDrafts();
      });
    }
  };

  const handleInventoryToggle = (itemId: string, current: boolean) => {
    setInventory(prev => prev.map(i => i.id === itemId ? { ...i, isAvailable: !current } : i));
    startTransition(async () => await toggleMenuItemAvailability(itemId, current));
  };

  const activeTablesCount = Array.from(new Set(orders.filter(o => o.payment_status === 'pending').map(o => o.table_number))).length;
  const pendingCount   = orders.filter(o => o.status === 'pending').length;
  const preparingCount = orders.filter(o => o.status === 'preparing').length;
  const totalRevenue   = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total_amount, 0);

  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');
  const tableMap = new Map<string, DbOrder[]>();
  completedOrders.forEach(o => {
    if (!tableMap.has(o.table_number)) tableMap.set(o.table_number, []);
    tableMap.get(o.table_number)!.push(o);
  });
  
  const sortedDraftTables = Array.from(tableMap.keys()).sort((a, b) => {
    const latestA = Math.max(...tableMap.get(a)!.map(o => new Date(o.updated_at || o.created_at).getTime()));
    const latestB = Math.max(...tableMap.get(b)!.map(o => new Date(o.updated_at || o.created_at).getTime()));
    return latestB - latestA;
  }).slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col font-sans relative" style={{ backgroundColor: '#1e1516', color: '#FAF7EE' }}>
      
      {/* ── TOP HEADER ── */}
      <header className="sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-white/10 bg-[#1e1516]">
        <div>
          <h1 className="text-2xl font-black font-display flex items-center gap-2" style={{ color: '#F3CC8F' }}>{defaultTheme.name} <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-[#E07A5F] text-[#FAF7EE] border border-[#1A1A1A]">Kitchen Deck</span></h1>
          <div className="flex items-center gap-2 mt-0.5">
            {isConnected ? <><Wifi size={12} className="text-emerald-400" /><span className="text-[11px] text-emerald-400 font-bold">Live</span></> : <><WifiOff size={12} className="text-zinc-500" /><span className="text-[11px] text-zinc-500 font-bold">Connecting...</span></>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setIsMuted(m => !m)} className="p-2 rounded-xl border-2 border-white/15 bg-transparent">
            {isMuted ? <VolumeX size={18} className="text-rose-400" /> : <Volume2 size={18} className="text-emerald-400" />}
          </button>
          <div className="flex overflow-hidden rounded-xl border-2 border-white/15">
            {(['orders', 'inventory'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-xs font-black capitalize transition-colors" style={{ backgroundColor: activeTab === tab ? '#E07A5F' : 'transparent', color: activeTab === tab ? '#FAF7EE' : 'rgba(250,247,238,0.5)' }}>
                {tab === 'orders' ? 'Live Orders' : 'Inventory'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── STATS ── */}
      {activeTab === 'orders' && (
        <section className="px-6 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenue (Paid)', val: formatPrice(totalRevenue), icon: TrendingUp, accent: '#34d399' },
              { label: 'New Tickets',    val: pendingCount,              icon: Clock,      accent: '#f59e0b' },
              { label: 'In Kitchen',     val: preparingCount,            icon: ChefHat,    accent: '#60a5fa' },
              { label: 'Active Tables',  val: activeTablesCount,         icon: ReceiptText,accent: '#34d399' },
            ].map(({ label, val, icon: Icon, accent }) => (
              <div key={label} className="flex items-center justify-between p-4 rounded-2xl bg-[#2d1f21] border-2 border-white/5">
                <div><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</p><p className="text-xl font-black font-display mt-0.5">{val}</p></div>
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${accent}18` }}><Icon size={18} style={{ color: accent }} /></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── MAIN CONTENT (KANBAN) ── */}
      <main className="flex-1 px-6 pb-8 overflow-x-auto">
        {activeTab === 'orders' && (
          <div className="flex gap-6 min-w-max h-full items-start">
            {COLUMNS.map(col => {
              
              if (col.id === 'payment') {
                const tablesAwaitingPayment = Array.from(new Set(
                  orders.filter(o => o.status === 'served' && o.payment_status === 'pending').map(o => o.table_number)
                ));

                return (
                  <div key={col.id} className="flex flex-col gap-4 w-[340px] shrink-0">
                    <div className="flex items-center justify-between pb-2" style={{ borderBottom: `3px solid ${col.borderColor}` }}>
                      <div className="flex items-center gap-2"><col.icon size={16} className={col.color} /><span className={`text-sm font-black uppercase tracking-wider ${col.color}`}>{col.label}</span></div>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${col.borderColor}20`, color: col.borderColor }}>{tablesAwaitingPayment.length} Tables</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      <AnimatePresence>
                        {tablesAwaitingPayment.map(table => (
                          <TablePaymentCard key={table} table={table} orders={orders} onClear={handleClearTable} isClearing={clearingTableId === table} />
                        ))}
                      </AnimatePresence>
                      {tablesAwaitingPayment.length === 0 && <p className="text-xs text-zinc-600 italic text-center py-8">No bills awaiting checkout.</p>}
                    </div>
                  </div>
                );
              }

              // --- COLUMN 4: DRAFTS WITH CLEAR BUTTON ---
              if (col.id === 'completed') {
                return (
                  <div key={col.id} className="flex flex-col gap-4 w-[340px] shrink-0">
                    <div className="flex items-center justify-between pb-2" style={{ borderBottom: `3px solid ${col.borderColor}` }}>
                      <div className="flex items-center gap-2"><col.icon size={16} className={col.color} /><span className={`text-sm font-black uppercase tracking-wider ${col.color}`}>{col.label}</span></div>
                      
                      {/* CLEAR DRAFTS BUTTON */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${col.borderColor}20`, color: col.borderColor }}>{sortedDraftTables.length} Tables</span>
                        <button 
                          onClick={handleClearAllDrafts} 
                          disabled={isClearingDrafts || sortedDraftTables.length === 0} 
                          className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" 
                          title="Wipe Board"
                        >
                          {isClearingDrafts ? <Loader2 size={16} className="animate-spin text-rose-400" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <AnimatePresence>
                        {sortedDraftTables.map(table => {
                          const tOrders = tableMap.get(table)!;
                          const latest = Math.max(...tOrders.map(o => new Date(o.updated_at || o.created_at).getTime()));
                          const total = tOrders.reduce((sum, o) => sum + o.total_amount, 0);
                          const items = tOrders.flatMap(o => o.items);
                          return <TableDraftCard key={table} table={table} latestTime={latest} total={total} items={items} />;
                        })}
                      </AnimatePresence>
                      {sortedDraftTables.length === 0 && <p className="text-xs text-zinc-600 italic text-center py-8">No completed tables.</p>}
                    </div>
                  </div>
                );
              }

              const colOrders = orders.filter(o => o.status === col.id);
              
              return (
                <div key={col.id} className="flex flex-col gap-4 w-[320px] shrink-0">
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: `3px solid ${col.borderColor}` }}>
                    <div className="flex items-center gap-2"><col.icon size={16} className={col.color} /><span className={`text-sm font-black uppercase tracking-wider ${col.color}`}>{col.label}</span></div>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${col.borderColor}20`, color: col.borderColor }}>{colOrders.length} Tickets</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <AnimatePresence>
                      {colOrders.map(order => (
                        <OrderCard key={order.id} order={order} isNew={newOrderIds.has(order.id)} onStatusChange={handleStatusChange} isMutating={mutatingId === order.id} />
                      ))}
                    </AnimatePresence>
                    {colOrders.length === 0 && <p className="text-xs text-zinc-600 italic text-center py-8">Queue empty.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="rounded-3xl p-6 bg-[#2d1f21] border-2 border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black font-display text-[#F3CC8F]">Menu Stock</h2>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#E07A5F20] text-[#E07A5F] border border-[#E07A5F40]">{inventory.filter(i => i.isAvailable).length} Active</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl transition-opacity" style={{ backgroundColor: '#1e1516', border: `2px solid ${item.isAvailable ? 'rgba(250,247,238,0.1)' : '#7f1d1d'}`, opacity: item.isAvailable ? 1 : 0.6 }}>
                  <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border-2 border-white/10" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm line-clamp-1 text-[#FAF7EE]">{item.name}</h3>
                    <p className="text-xs font-bold text-[#E07A5F]">{formatPrice(item.price)}</p>
                  </div>
                  <button onClick={() => handleInventoryToggle(item.id, item.isAvailable)} className="relative w-11 h-6 rounded-full flex-shrink-0 cursor-pointer transition-colors" style={{ backgroundColor: item.isAvailable ? '#16a34a' : '#3f3f46', border: '2px solid rgba(250,247,238,0.2)' }}>
                    <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="absolute top-0.5 w-4 h-4 rounded-full bg-white border border-black/20" style={{ left: item.isAvailable ? '23px' : '2px' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}