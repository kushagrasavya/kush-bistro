'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChefHat, Mail, Lock, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { defaultTheme } from '@/lib/theme';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Force a hard refresh to ensure the Server Layout reads the new auth cookie
        router.push('/admin/dashboard');
        router.refresh(); 
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate.');
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 font-sans"
      style={{ backgroundColor: '#1e1516', color: '#FAF7EE' }}
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] p-8 rounded-3xl"
        style={{ 
          backgroundColor: '#2d1f21', 
          border: '2px solid rgba(250,247,238,0.1)' 
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ 
              backgroundColor: '#E07A5F', 
              border: '2px solid #1A1A1A',
              boxShadow: '4px 4px 0px #1A1A1A'
            }}
          >
            <ChefHat size={28} color="#FAF7EE" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black font-display mb-1" style={{ color: '#F3CC8F' }}>
            {defaultTheme.name}
          </h1>
          <span 
            className="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest"
            style={{ backgroundColor: '#1e1516', color: '#E07A5F', border: '1px solid rgba(224,122,95,0.3)' }}
          >
            Authorized Access Only
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3 rounded-xl flex items-start gap-3 text-sm font-bold"
            style={{ backgroundColor: '#4c0519', color: '#fda4af', border: '1px solid #9f1239' }}
          >
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-zinc-400 pl-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@kitchendeck.com"
                className="w-full h-12 pl-11 pr-4 rounded-xl text-sm font-bold placeholder:text-zinc-600 outline-none transition-all"
                style={{ 
                  backgroundColor: '#1e1516', 
                  color: '#FAF7EE',
                  border: '2px solid rgba(250,247,238,0.1)',
                }}
                onFocus={(e) => e.target.style.borderColor = '#E07A5F'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(250,247,238,0.1)'}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-zinc-400 pl-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-12 pl-11 pr-4 rounded-xl text-sm font-bold placeholder:text-zinc-600 outline-none transition-all"
                style={{ 
                  backgroundColor: '#1e1516', 
                  color: '#FAF7EE',
                  border: '2px solid rgba(250,247,238,0.1)',
                }}
                onFocus={(e) => e.target.style.borderColor = '#E07A5F'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(250,247,238,0.1)'}
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
            type="submit"
            className="w-full h-12 mt-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ 
              backgroundColor: '#E07A5F', 
              color: '#FAF7EE',
              border: '2px solid #1A1A1A',
              boxShadow: '4px 4px 0px #1A1A1A'
            }}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Unlock Kitchen Deck
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}