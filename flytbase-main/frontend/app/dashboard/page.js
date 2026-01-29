'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { missionsAPI, fleetAPI, reportsAPI } from '@/lib/api';
import Link from 'next/link';
import { LoadingPage } from '@/components/Loading';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    missions: { total: 0, active: 0, completed: 0 },
    fleet: { total: 0, idle: 0, active: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState({
    temp: 24,
    wind: 12,
    visibility: 'CLEAR',
    status: 'OPTIMAL'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadDashboardData();
    // Mock weather fluctuation
    setWeather({
      temp: (22 + Math.random() * 5).toFixed(1),
      wind: (10 + Math.random() * 15).toFixed(1),
      visibility: Math.random() > 0.1 ? 'CLEAR' : 'HAZY',
      status: Math.random() > 0.2 ? 'OPTIMAL' : 'CAUTION'
    });
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const [missionStats, fleetStats] = await Promise.all([
        reportsAPI.getMissionStats(),
        reportsAPI.getFleetStats(),
      ]);

      setStats({
        missions: {
          total: missionStats.data.overall.total_missions || 0,
          active: missionStats.data.overall.active_missions || 0,
          completed: missionStats.data.overall.completed_missions || 0,
        },
        fleet: {
          total: fleetStats.data.overview.total_drones || 0,
          idle: fleetStats.data.overview.idle_drones || 0,
          active: fleetStats.data.overview.active_drones || 0,
        },
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingPage message="SYNCING WITH ORBITAL ASSETS..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-0">
        {/* Top Header & Env HUD */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-md flex justify-between items-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div>
              <p className="text-[10px] font-black text-primary-500 tracking-[0.4em] uppercase mb-1">Global Command</p>
              <h1 className="text-3xl font-black text-white tracking-tighter">PROJECT FLYTBASE</h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">System Frequency</span>
                <span className="text-xl font-mono text-white">433.9 <span className="text-xs text-primary-400">MHz</span></span>
              </div>
              <div className="h-10 w-px bg-white/10"></div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-green-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></span>
                  ONLINE
                </span>
                <span className="text-[10px] text-gray-500 font-mono italic">SECURE_LINK_ESTABLISHED</span>
              </div>
            </div>
          </div>

          <div className="lg:w-1/3 glass-panel p-6 rounded-2xl border border-white/10 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none text-4xl">🛰️</div>
            <div className="space-y-4 w-full">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Environment</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${weather.status === 'OPTIMAL' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {weather.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[8px] text-gray-500 block">TEMP</span>
                  <span className="text-sm font-mono text-white">{weather.temp}°C</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[8px] text-gray-500 block">WIND</span>
                  <span className="text-sm font-mono text-white">{weather.wind}kt</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[8px] text-gray-500 block">VIS</span>
                  <span className="text-sm font-mono text-white">{weather.visibility}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Missions', val: stats.missions.total, icon: '📋', col: 'primary' },
            { label: 'Airborne Now', val: stats.missions.active, icon: '🚀', col: 'secondary' },
            { label: 'Ops Completed', val: stats.missions.completed, icon: '✅', col: 'blue' },
            { label: 'Fleet Assets', val: stats.fleet.total, icon: '🛸', col: 'accent' }
          ].map((m, i) => (
            <div key={i} className="glass-panel p-5 rounded-2xl border border-white/10 relative overflow-hidden group hover:bg-white/5 transition-all">
              <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.03] group-hover:opacity-10 blur-xl transition-opacity bg-white"></div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase">{m.label}</span>
                <span className="text-lg opacity-40 group-hover:opacity-100 transition-opacity">{m.icon}</span>
              </div>
              <p className="text-4xl font-black font-mono text-white transition-colors">{m.val}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Action Modules */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden bg-slate-900/40">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
              <h2 className="text-xs font-black text-white/40 tracking-[0.5em] uppercase mb-8 flex items-center">
                <span className="w-8 h-[1px] bg-white/10 mr-4"></span>
                Strategic Operations
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/missions/planner" className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary-500/10 hover:border-primary-500/30 transition-all flex flex-col justify-between h-40">
                  <div className="flex justify-between items-start">
                    <span className="text-3xl p-3 bg-primary-500/10 rounded-xl group-hover:scale-110 transition-transform">➕</span>
                    <span className="text-[10px] font-mono text-primary-500/60 opacity-0 group-hover:opacity-100 transition-opacity">INT_NEW_OPS</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Mission Planner</h3>
                    <p className="text-xs text-gray-500">Initialize custom survey area</p>
                  </div>
                </Link>

                <Link href="/missions/monitor" className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-accent-500/10 hover:border-accent-500/30 transition-all flex flex-col justify-between h-40">
                  <div className="flex justify-between items-start">
                    <span className="text-3xl p-3 bg-accent-500/10 rounded-xl group-hover:scale-110 transition-transform animate-pulse">📡</span>
                    <span className="text-[10px] font-mono text-accent-500/60 opacity-0 group-hover:opacity-100 transition-opacity">UPLINK_LIVE</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Live Monitor</h3>
                    <p className="text-xs text-gray-500 text-accent-400 group-hover:animate-pulse">Active telemetry tracking</p>
                  </div>
                </Link>

                <Link href="/fleet" className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-secondary-500/10 hover:border-secondary-500/30 transition-all flex items-center gap-6 sm:col-span-2">
                  <span className="text-4xl p-4 bg-secondary-500/10 rounded-2xl group-hover:rotate-12 transition-transform">🛸</span>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Asset Fleet Control</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Maintain, Deploy & Decommission Units</p>
                  </div>
                  <span className="ml-auto text-xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">→</span>
                </Link>
              </div>
            </div>

            {/* Quick Summary / Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60">
                <h3 className="text-[10px] font-black text-gray-500 tracking-[0.4em] uppercase mb-6">Fleet Readiness</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs text-gray-400 uppercase">Available Units</span>
                    <span className="text-xl text-green-400 font-bold">{stats.fleet.idle}</span>
                  </div>
                  <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-1000"
                      style={{ width: `${stats.fleet.total > 0 ? (stats.fleet.idle / stats.fleet.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-gray-500 uppercase">
                    <span>Efficiency Rating: </span>
                    <span className="text-primary-400 font-bold">OPTIMIZED</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-slate-900/60 flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_center,theme('colors.primary.500'),transparent_70%)]"></div>
                <div className="text-center relative z-10">
                  <p className="text-[10px] font-black text-gray-500 tracking-[0.4em] uppercase mb-4">Success Quotient</p>
                  <p className="text-6xl font-black text-white font-mono tracking-tighter">
                    {stats.missions.total > 0 ? Math.round((stats.missions.completed / stats.missions.total) * 100) : 100}<span className="text-2xl text-primary-500">%</span>
                  </p>
                  <p className="text-[8px] text-primary-400 font-mono mt-2 tracking-widest">MISSION_RELIABILITY_SCORE</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar System Terminal */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-panel rounded-3xl border border-white/10 bg-slate-950 flex flex-col h-[600px] overflow-hidden">
              <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
                  <h3 className="text-xs font-black text-white/50 tracking-[0.4em] uppercase">System Events</h3>
                </div>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                  <span className="text-[8px] font-mono text-white/20">LIVE</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative font-mono text-[10px]">
                {/* Visual Scanning Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(255,255,255,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

                <div className="text-green-500/80">
                  <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span> SYS_INIT_COMPLETE: PROJECT FLYTBASE CORE
                </div>
                <div className="text-blue-400/80">
                  <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span> UPLINK_SYNC: Fleet coordinates updated (Total: {stats.fleet.total})
                </div>
                <div className="text-primary-400/80">
                  <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span> DB_CONNECT: MongoDB Cluster responsive
                </div>
                <div className="text-gray-500">
                  <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span> WEATH_CHECK: Optimal conditions at Base-7
                </div>
                <div className="pt-4 text-white/40 border-t border-white/5">
                  &gt; AUTHENTICATED AS OPERATOR_ADMIN
                  <br />&gt; DIRECTIVES: MONITOR_AND_MAINTAIN
                </div>

                <div className="mt-8 flex flex-col items-center justify-center py-10 opacity-20">
                  <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                  <span className="mt-4 text-[8px] tracking-[0.5em] uppercase">Monitoring Signals...</span>
                </div>
              </div>

              <div className="p-3 bg-black/40 border-t border-white/5 flex justify-between items-center text-[8px] text-gray-600">
                <span>INTEL_OS v1.0.4</span>
                <span className="animate-pulse">_LISTENING_MODE</span>
              </div>
            </div>

            {/* Weather Detail / Warning */}
            <div className={`p-6 rounded-3xl border transition-all ${weather.status === 'OPTIMAL' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20 animate-pulse'}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-black tracking-widest uppercase ${weather.status === 'OPTIMAL' ? 'text-green-500' : 'text-red-500'}`}>
                  Safety Protocol
                </span>
                <span className="text-xl">🛡️</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-mono italic">
                {weather.status === 'OPTIMAL'
                  ? 'Environmental conditions are currently within safe margins. All flight operations authorized.'
                  : 'Atmospheric turbulence detected. High-altitude operations should be deferred until visibility clears.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
