'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { defaultTheme, getThemeStyles } from '@/lib/theme';
import { ArrowRight, UtensilsCrossed, Zap, Star, Coffee, Lock } from 'lucide-react';

export default function WelcomeGateway() {
  const router = useRouter();
  const [tableInput, setTableInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const styles = getThemeStyles(defaultTheme);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableInput.trim()) {
      router.push(`/table/${encodeURIComponent(tableInput.trim())}`);
    }
  };

  const selectDemoTable = (table: string) => {
    router.push(`/table/${table}`);
  };

  const demoTables = [
    { table: '1', emoji: '🌿' },
    { table: '5', emoji: '✨' },
    { table: '12A', emoji: '🔥' },
  ];

  return (
    <main
      style={styles}
      className="min-h-screen flex flex-col items-center justify-center p-5 font-sans relative overflow-hidden"
    >
      {/* Cream Background */}
      <div className="absolute inset-0 bg-[#FAF7EE]" />

      {/* Decorative Background Shapes */}
      <div
        className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full border-[3px] border-[#1A1A1A] opacity-10 pointer-events-none"
      />
      <div
        className="absolute bottom-[-60px] left-[-60px] w-[250px] h-[250px] rounded-full border-[3px] border-[#1A1A1A] opacity-10 pointer-events-none"
      />
      <div
        className="absolute top-[15%] left-[5%] w-20 h-20 rounded-3xl border-[3px] border-[#E07A5F] opacity-20 rotate-12 pointer-events-none"
      />
      <div
        className="absolute bottom-[20%] right-[7%] w-14 h-14 rounded-2xl border-[3px] border-[#F3CC8F] opacity-30 -rotate-12 pointer-events-none"
      />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.175, 0.885, 0.32, 1.275] }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* Header Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex justify-center mb-6"
        >
          <div className="flex items-center gap-1.5 bg-[#E07A5F] text-[#FAF7EE] px-4 py-1.5 rounded-full border-2 border-[#1A1A1A] font-extrabold text-[11px] uppercase tracking-[0.12em] shadow-[3px_3px_0px_#1A1A1A]">
            <Zap size={11} className="fill-current" />
            QR Order System Active
          </div>
        </motion.div>

        {/* Main panel */}
        <div className="bg-white border-[2.5px] border-[#1A1A1A] rounded-3xl shadow-[8px_8px_0px_0px_#1A1A1A] p-8 flex flex-col items-center">

          {/* Logo + Brand */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            className="w-16 h-16 rounded-2xl border-[2.5px] border-[#1A1A1A] shadow-[4px_4px_0px_#1A1A1A] flex items-center justify-center mb-5"
            style={{ backgroundColor: '#E07A5F' }}
          >
            <UtensilsCrossed size={28} color="#FAF7EE" strokeWidth={2.5} />
          </motion.div>

          <h1 className="font-black text-3xl tracking-tight text-[#1A1A1A] text-center mb-1 font-display">
            {defaultTheme.name}
          </h1>
          <p className="text-[#5A5245] text-sm text-center mb-7 font-medium">
            {defaultTheme.tagline}
          </p>

          {/* Table Input Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mb-6">
            <div className="relative">
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#1A1A1A] mb-1.5">
                Enter Table Number
              </label>
              <input
                type="text"
                placeholder="e.g., 5, 12A, VIP-1"
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full h-12 px-4 rounded-xl text-center text-lg font-extrabold tracking-wider transition-all outline-none bg-[#FAF7EE]"
                style={{
                  border: isFocused ? '2.5px solid #E07A5F' : '2.5px solid #1A1A1A',
                  boxShadow: isFocused ? '3px 3px 0px #E07A5F' : '3px 3px 0px #1A1A1A',
                  color: '#1A1A1A',
                }}
              />
            </div>

            <motion.button
              type="submit"
              disabled={!tableInput.trim()}
              whileTap={{ scale: 0.97 }}
              className="w-full h-12 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{
                backgroundColor: '#E07A5F',
                color: '#FAF7EE',
                border: '2.5px solid #1A1A1A',
                boxShadow: tableInput.trim() ? '4px 4px 0px #1A1A1A' : 'none',
              }}
            >
              Enter Menu
              <ArrowRight size={17} strokeWidth={3} />
            </motion.button>
          </form>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 mb-5">
            <div className="flex-1 h-[2px] bg-[#1A1A1A]/10" />
            <span className="text-[10px] font-black uppercase tracking-wider text-[#5A5245]">
              Try Demo Tables
            </span>
            <div className="flex-1 h-[2px] bg-[#1A1A1A]/10" />
          </div>

          {/* Demo Table Quick Select */}
          <div className="w-full grid grid-cols-3 gap-3 mb-6">
            {demoTables.map(({ table, emoji }) => (
              <motion.button
                key={table}
                whileHover={{ y: -2, boxShadow: '4px 4px 0px #1A1A1A' }}
                whileTap={{ y: 0, boxShadow: '2px 2px 0px #1A1A1A' }}
                onClick={() => selectDemoTable(table)}
                className="py-3 px-2 rounded-xl flex flex-col items-center gap-1 cursor-pointer transition-all"
                style={{
                  backgroundColor: '#FAF7EE',
                  border: '2px solid #1A1A1A',
                  boxShadow: '2px 2px 0px #1A1A1A',
                }}
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-xs font-black text-[#1A1A1A]">Table {table}</span>
              </motion.button>
            ))}
          </div>

          {/* Admin Dashboard Link */}
          <div className="w-full pt-5 border-t-[2.5px] border-dashed border-[#1A1A1A]/20">
            <Link href="/admin/dashboard">
              <motion.div
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-xl font-black text-xs tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors"
                style={{
                  backgroundColor: '#1A1A1A',
                  color: '#FAF7EE',
                  border: '2px solid #1A1A1A',
                }}
              >
                <Lock size={14} />
                Access Owner Dashboard
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Footer Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-3 mt-5 flex-wrap"
        >
          {[
            { icon: Star, label: 'Chef Curated' },
            { icon: Coffee, label: 'Fresh Daily' },
            { icon: Zap, label: 'Instant Orders' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1 text-[10px] font-bold text-[#5A5245] bg-[#F3CC8F]/40 px-2.5 py-1 rounded-full border border-[#F3CC8F]"
            >
              <Icon size={10} />
              {label}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </main>
  );
}