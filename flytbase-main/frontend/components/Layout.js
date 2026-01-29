'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState('');

  const [visionMode, setVisionMode] = useState('standard');
  const [tickerIndex, setTickerIndex] = useState(0);

  const intelTicker = [
    "INTEL: Satellite uplink stable. Zone Alpha coverage at 98%.",
    "ALERT: Battery depletion detected in Unit-204. Vectoring to base.",
    "SCAN: All sensors nominal. Atmospheric turbulence minimal.",
    "STATUS: Encryption ley rotation successful. Link secure.",
    "COMM: Sector 7 reported cleared for high-altitude survey.",
    "WIND: Vector 045 at 12 knots. Baseline stability maintained."
  ];

  useEffect(() => {
    setMounted(true);
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour12: false }));
    }, 1000);

    const tickerTimer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % intelTicker.length);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(tickerTimer);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const cycleVision = () => {
    const modes = ['standard', 'emerald', 'frost', 'hazard'];
    const nextIndex = (modes.indexOf(visionMode) + 1) % modes.length;
    setVisionMode(modes[nextIndex]);
  };

  const getVisionStyles = () => {
    switch (visionMode) {
      case 'emerald': return 'sepia(0.2) hue-rotate(80deg) brightness(1.1) contrast(1.1)';
      case 'frost': return 'hue-rotate(180deg) brightness(1.1) saturate(0.8)';
      case 'hazard': return 'sepia(0.5) hue-rotate(-40deg) brightness(1.1) contrast(1.2)';
      default: return 'none';
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Missions', href: '/missions' },
    { name: 'Mission Planner', href: '/missions/planner' },
    { name: 'Live Monitor', href: '/missions/monitor' },
    { name: 'Fleet', href: '/fleet' },
    { name: 'Analytics', href: '/analytics' },
  ];

  return (
    <div
      className={`min-h-screen bg-background text-gray-100 flex flex-col font-sans selection:bg-primary-500/30 transition-all duration-700`}
      style={{ filter: getVisionStyles() }}
    >
      {visionMode !== 'standard' && (
        <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.1)_1px,transparent_1px,transparent_2px)]"></div>
      )}

      {/* Top Navbar */}
      <nav className="glass-panel sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_theme('colors.primary.900')]">
                  <span className="text-lg">🛸</span>
                </div>
                <h1 className="text-xl font-bold tracking-tighter text-white">
                  FLYT<span className="text-primary-400">BASE</span>
                </h1>
              </div>
              <div className="hidden md:flex items-center gap-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-transparent ${isActive
                        ? 'bg-primary-500/10 text-primary-400 border-primary-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Vision Mode Toggle */}
              <button
                onClick={cycleVision}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-gray-400 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
                title="Change Mission Vision Mode"
              >
                <span className={`w-2 h-2 rounded-full ${visionMode === 'standard' ? 'bg-gray-500' :
                  visionMode === 'emerald' ? 'bg-green-500' :
                    visionMode === 'frost' ? 'bg-blue-400' : 'bg-orange-500'
                  }`}></span>
                {visionMode}_VISION
              </button>

              {user && (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                    <p className="text-[10px] text-primary-500 font-mono uppercase tracking-tighter">{user.role}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-xs font-bold text-primary-400">
                    {user.name[0]}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
          {children}
        </div>
      </main>

      {/* Bottom Tactical Status Bar with Global Intel Ticker */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 bg-surface/90 backdrop-blur-sm border-t border-white/5 z-50 flex items-center px-4 justify-between text-[10px] font-mono tracking-widest text-gray-400 overflow-hidden">
        <div className="flex items-center gap-6 overflow-hidden flex-1 mr-8">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-ping"></span>
            <span className="uppercase font-black text-primary-500">GLOBAL_INTEL: </span>
          </div>
          <div className="truncate animate-in slide-in-from-right duration-1000">
            {intelTicker[tickerIndex]}
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="hidden lg:flex items-center gap-2">
            <span className="uppercase text-gray-600">Lat: 37.77 \ Lng: -122.41</span>
          </div>
          <div className="hidden md:block">SYS_LOAD: <span className="text-primary-500">2.4%</span></div>
          <div className="font-bold text-gray-400 uppercase">
            {mounted ? time : '--:--:--'} <span className="text-gray-600">UTC</span>
          </div>
        </div>
      </footer>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-panel text-white border border-white/10',
          style: {
            background: 'rgba(30, 41, 59, 0.9)',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

