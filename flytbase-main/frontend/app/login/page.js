'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { ButtonLoader } from '@/components/Loading';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      toast.success('Secure Data Link Established');
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary-900/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-secondary-900/20 blur-[120px] rounded-full"></div>

      <div className="max-w-md w-full space-y-8 glass-panel p-10 rounded-2xl border border-white/10 relative z-10 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-600/20 border border-primary-500/30 mb-6 shadow-[0_0_20px_theme('colors.primary.900')]">
            <span className="text-4xl">🛸</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            FLYTBASE <span className="text-primary-400">OS</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400 font-mono tracking-widest text-uppercase">
            SECURE MISSION UPLINK
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm animate-shake">
              <span className="font-bold mr-2">BLOCK:</span> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Terminal ID (Email)</label>
              <input
                type="email"
                required
                className="appearance-none block w-full px-4 py-3 border border-white/10 bg-white/5 rounded-xl placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="admin@flytbase.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Access Cipher (Password)</label>
              <input
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 border border-white/10 bg-white/5 rounded-xl placeholder-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-all shadow-[0_0_15px_theme('colors.primary.900')]"
            >
              {loading ? <ButtonLoader /> : 'INITIALIZE SESSION'}
            </button>
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-500">DEFAULT ACCESS:</span>
              <span className="text-primary-400">admin@flytbase.com / admin123</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

