'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, CheckCircle2, ReceiptText, Clock, Store, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';
import { mockMenuItems } from '@/lib/mockData';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, addItem, decrementItem, removeItem, tableNumber, clearCart } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  // States: 'none', 'kitchen' (success), 'payment' (bill), 'verifying' (waiting for admin)
  const [orderPlacedState, setOrderPlacedState] = useState<'none' | 'kitchen' | 'payment' | 'verifying'>('none');
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  
  const [runningTabItems, setRunningTabItems] = useState<any[]>([]);
  const [runningTabTotal, setRunningTabTotal] = useState(0);
  const supabase = createClient();

  const MOCK_MENU_MAP = Object.fromEntries(mockMenuItems.map(i => [i.id, i.name]));

  // --- FETCH LIVE TABLE BILL ---
  useEffect(() => {
    if (!tableNumber) return;

    const fetchRunningTab = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('table_number', tableNumber)
        .eq('payment_status', 'pending');

      if (!error && data) {
        let total = 0;
        let combinedItems: any[] = [];
        let hasSubmittedUtr = false;
        
        data.forEach(order => {
          total += order.total_amount;
          if (order.payment_id) hasSubmittedUtr = true; // Check if UTR is already in database
          if (Array.isArray(order.items)) {
            const itemsWithStatus = order.items.map(item => ({ 
              ...item, orderStatus: order.status, name: item.name || MOCK_MENU_MAP[item.menuItemId] || 'Menu Item'
            }));
            combinedItems = [...combinedItems, ...itemsWithStatus];
          }
        });
        
        setRunningTabTotal(total);
        setRunningTabItems(combinedItems);
        
        // Auto-close payment screen if the Admin confirmed payment (total drops to 0)
        if (total === 0 && (orderPlacedState === 'payment' || orderPlacedState === 'verifying')) {
          setOrderPlacedState('none');
          setUtrInput(''); // Reset UTR input
        } else if (hasSubmittedUtr && total > 0) {
          setOrderPlacedState('verifying');
        }
      }
    };

    fetchRunningTab();

    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `table_number=eq.${tableNumber}` }, () => {
        fetchRunningTab();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableNumber, orderPlacedState]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = subtotal + runningTabTotal;

  const formatPrice = (paise: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paise / 100);

  // --- DUAL CHECKOUT LOGIC ---
  const handleOrder = async (isPayingNow: boolean) => {
    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          items: items.map((item) => ({ menuItemId: item.menuItemId, quantity: item.quantity })),
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to place order');

      clearCart();
      
      if (isPayingNow) {
        setTimeout(() => setOrderPlacedState('payment'), 300);
      } else {
        setOrderPlacedState('kitchen');
        setTimeout(() => setOrderPlacedState('none'), 2500);
      }
    } catch (error: any) {
      console.error("Order failed:", error);
      alert(error.message || 'Network error, please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // --- SUBMIT UTR LOGIC ---
  const handleSubmitUtr = async () => {
    if (utrInput.length < 6) return alert('Please enter a valid UPI Reference Number');
    setIsSubmittingUtr(true);
    
    try {
      const response = await fetch('/api/utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, utr: utrInput }),
      });
      if (!response.ok) throw new Error('Failed to submit UTR');
      
      setOrderPlacedState('verifying');
    } catch (error) {
      alert('Network error. Please show your screen at the counter.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const amountToPay = (runningTabTotal > 0 ? runningTabTotal : grandTotal);
  const amountInRupees = (amountToPay / 100).toFixed(2);
  const upiId = "kushagrasavya.choudhary@oksbi"; // REPLACE WITH CAFE UPI
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent("Neon Bistro")}&am=${amountInRupees}&cu=INR&tn=${encodeURIComponent(`Table ${tableNumber}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-[#1A1A1A] z-40" />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[380px] z-50 flex flex-col"
            style={{ backgroundColor: '#FAF7EE', borderLeft: '2.5px solid #1A1A1A', boxShadow: '-8px 0px 0px 0px #1A1A1A' }}
          >
            <div className="px-5 py-4 flex justify-between items-center shrink-0" style={{ borderBottom: '2.5px solid #1A1A1A', backgroundColor: '#E07A5F' }}>
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={20} color="#FAF7EE" strokeWidth={2.5} />
                <h2 className="font-black text-[#FAF7EE] text-lg font-display">Your Table</h2>
                {tableNumber && <span className="text-[10px] bg-[#FAF7EE] text-[#E07A5F] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider" style={{ border: '1.5px solid #1A1A1A' }}>Table {tableNumber}</span>}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"><X size={20} color="#FAF7EE" strokeWidth={2.5} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
              
              {/* SUCCESS STATES OVERLAY */}
              {orderPlacedState === 'kitchen' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-[#FAF7EE]">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#F3CC8F', border: '3px solid #1A1A1A', boxShadow: '5px 5px 0px #1A1A1A' }}>
                    <CheckCircle2 size={36} color="#1A1A1A" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-[#1A1A1A] font-display mb-2">Sent to Kitchen!</h3>
                </div>
              )}

              {/* WAITING FOR ADMIN OVERLAY */}
              {orderPlacedState === 'verifying' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center p-6 bg-[#FAF7EE]">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: '#EAE5D8', border: '3px dashed #E07A5F' }}>
                    <ShieldCheck size={36} color="#E07A5F" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-[#1A1A1A] font-display mb-2">Verifying Payment...</h3>
                  <p className="text-[#5A5245] text-sm mb-4">The counter is checking your transaction. This screen will close automatically once confirmed!</p>
                </div>
              )}

              {/* PAYMENT DIGITAL BILL SCREEN */}
              {orderPlacedState === 'payment' && (
                <div className="absolute inset-0 z-10 flex flex-col p-6 bg-[#FAF7EE] overflow-y-auto">
                  <h3 className="text-2xl font-black text-[#1A1A1A] font-display mb-1 text-center mt-2">Final Bill</h3>
                  <p className="font-black text-4xl text-[#E07A5F] mb-6 text-center">{formatPrice(amountToPay)}</p>
                  
                  {/* UPI QR */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="p-3 bg-white rounded-3xl mb-4" style={{ border: '3px solid #1A1A1A', boxShadow: '4px 4px 0px #1A1A1A' }}>
                      <img src={qrCodeUrl} alt="UPI QR Code" className="w-32 h-32" />
                    </div>
                    <a href={upiUrl} className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2" style={{ backgroundColor: '#16a34a', color: '#FAF7EE', border: '2.5px solid #1A1A1A', boxShadow: '3px 3px 0px #1A1A1A' }}>
                      Open UPI App on Phone
                    </a>
                  </div>

                  {/* UTR SUBMISSION FORM */}
                  <div className="bg-[#EAE5D8] p-4 rounded-2xl mb-6" style={{ border: '2px solid #1A1A1A' }}>
                    <h4 className="text-xs font-black uppercase text-[#1A1A1A] mb-2">Already Paid?</h4>
                    <p className="text-[10px] font-bold text-zinc-500 mb-2 leading-tight">Enter your 12-digit UPI Reference Number (UTR) below so the kitchen can confirm it.</p>
                    <input 
                      type="number" 
                      placeholder="e.g. 312345678901" 
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      className="w-full h-11 px-3 mb-3 rounded-xl text-sm font-bold border-2 border-[#1A1A1A] outline-none focus:border-[#E07A5F]"
                    />
                    <button 
                      onClick={handleSubmitUtr}
                      disabled={isSubmittingUtr || utrInput.length < 6}
                      className="w-full py-2.5 rounded-lg font-black text-xs text-[#FAF7EE] bg-[#1A1A1A] disabled:opacity-50"
                    >
                      {isSubmittingUtr ? 'Sending...' : 'Notify Admin'}
                    </button>
                  </div>

                  <button onClick={() => setOrderPlacedState('none')} className="mt-auto py-2 text-xs font-black uppercase text-zinc-500 tracking-wider text-center w-full">Close & Return to Menu</button>
                </div>
              )}

              {/* STANDARD CART (SECTION 1 & 2) ... [Rest of cart rendering is identical] ... */}
              {items.length > 0 && orderPlacedState === 'none' && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#5A5245] mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#E07A5F]" />New Items</h3>
                  <div className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <motion.div key={item.menuItemId} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: '#FFFFFF', border: '2px solid #1A1A1A', boxShadow: '3px 3px 0px #1A1A1A' }}>
                          {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover flex-shrink-0" style={{ borderRadius: '10px', border: '2px solid #EAE5D8' }} />}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-sm text-[#1A1A1A] font-display line-clamp-1">{item.name}</h4>
                            <span className="text-xs text-[#E07A5F] font-bold">{formatPrice(item.price)}</span>
                          </div>
                          <div className="flex items-center overflow-hidden" style={{ border: '2px solid #1A1A1A', borderRadius: '10px' }}>
                            <button onClick={() => decrementItem(item.menuItemId)} className="p-1.5 hover:bg-[#EAE5D8]"><Minus size={11} strokeWidth={3} color="#1A1A1A" /></button>
                            <span className="px-2 text-xs font-black text-[#1A1A1A] min-w-[18px] text-center">{item.quantity}</span>
                            <button onClick={() => addItem({ ...item, quantity: 1 })} className="p-1.5 hover:bg-[#EAE5D8]"><Plus size={11} strokeWidth={3} color="#1A1A1A" /></button>
                          </div>
                          <button onClick={() => removeItem(item.menuItemId)} className="p-1.5 rounded-lg hover:bg-rose-100"><Trash2 size={14} color="#e11d48" /></button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {runningTabItems.length > 0 && orderPlacedState === 'none' && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#5A5245] mb-3 flex items-center gap-2"><ReceiptText size={14} />Running Tab</h3>
                  <div className="flex flex-col gap-2">
                    {runningTabItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl opacity-80" style={{ backgroundColor: '#EAE5D8', border: '1px dashed #5A5245' }}>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-bold text-[#1A1A1A] line-clamp-1">{item.quantity}x {item.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {item.orderStatus === 'pending' || item.orderStatus === 'preparing' ? <><Clock size={10} className="text-amber-600" /><span className="text-[9px] uppercase font-bold text-amber-600 tracking-wider">In Kitchen</span></> : <><CheckCircle2 size={10} className="text-emerald-600" /><span className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Served</span></>}
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#5A5245]">{formatPrice(item.priceAtOrder * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Dual Action Buttons */}
            {(items.length > 0 || runningTabItems.length > 0) && orderPlacedState === 'none' && (
              <div className="p-5 shrink-0" style={{ borderTop: '2.5px solid #1A1A1A', backgroundColor: '#FAF7EE' }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-black text-[#1A1A1A] uppercase tracking-wider">Total Due</span>
                  <span className="font-black text-2xl text-[#1A1A1A] font-display">{formatPrice(grandTotal)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {items.length > 0 && (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleOrder(false)} disabled={isCheckingOut || !tableNumber} className="w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer" style={{ backgroundColor: '#EAE5D8', color: '#1A1A1A', border: '2px solid #1A1A1A' }}>
                      {isCheckingOut ? 'Sending...' : 'Send to Kitchen (Pay Later)'}
                    </motion.button>
                  )}
                  <motion.button whileTap={{ scale: 0.97, boxShadow: '2px 2px 0px #1A1A1A' }} onClick={() => { if(items.length > 0) { handleOrder(true) } else { setOrderPlacedState('payment') } }} disabled={isCheckingOut || !tableNumber} className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer" style={{ backgroundColor: '#E07A5F', color: '#FAF7EE', border: '2.5px solid #1A1A1A', boxShadow: '4px 4px 0px #1A1A1A' }}>
                    View Bill & Pay <ArrowRight size={17} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}