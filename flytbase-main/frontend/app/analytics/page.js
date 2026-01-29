'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { reportsAPI } from '@/lib/api';
import { LoadingPage } from '@/components/Loading';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const router = useRouter();
  const [missionStats, setMissionStats] = useState(null);
  const [fleetStats, setFleetStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadAnalytics();
  }, [router]);

  const loadAnalytics = async () => {
    try {
      const [missionData, fleetData] = await Promise.all([
        reportsAPI.getMissionStats(),
        reportsAPI.getFleetStats(),
      ]);

      setMissionStats(missionData.data);
      setFleetStats(fleetData.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart.js Dark Mode Defaults
  ChartJS.defaults.color = 'rgba(255, 255, 255, 0.7)';
  ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
  ChartJS.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

  if (loading) {
    return (
      <Layout>
        <LoadingPage message="PROCESSING TELEMETRY DATA..." />
      </Layout>
    );
  }

  // Define chart options to hide grids and make it cleaner
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            family: 'monospace',
            size: 11
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        }
      }
    }
  };

  const missionTypeData = missionStats?.by_type
    ? {
      labels: missionStats.by_type.map((t) => t.mission_type),
      datasets: [
        {
          label: 'Missions',
          data: missionStats.by_type.map((t) => t.count),
          backgroundColor: [
            'rgba(59, 130, 246, 0.6)', // Blue
            'rgba(16, 185, 129, 0.6)', // Green
            'rgba(245, 158, 11, 0.6)', // Amber
            'rgba(239, 68, 68, 0.6)',  // Red
          ],
          borderColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ],
          borderWidth: 1,
          hoverBackgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444'
          ]
        },
      ],
    }
    : null;

  const fleetStatusData = fleetStats?.overview
    ? {
      labels: ['Idle', 'Active', 'Offline'],
      datasets: [
        {
          data: [
            fleetStats.overview.idle_drones,
            fleetStats.overview.active_drones,
            fleetStats.overview.offline_drones,
          ],
          backgroundColor: [
            'rgba(16, 185, 129, 0.6)',
            'rgba(59, 130, 246, 0.6)',
            'rgba(107, 114, 128, 0.6)',
          ],
          borderColor: [
            '#10B981',
            '#3B82F6',
            '#6B7280'
          ],
          borderWidth: 1,
        },
      ],
    }
    : null;

  const batteryDistributionData = fleetStats?.battery_distribution
    ? {
      labels: fleetStats.battery_distribution.map((b) => b.battery_range),
      datasets: [
        {
          label: 'Drones',
          data: fleetStats.battery_distribution.map((b) => b.count),
          backgroundColor: [
            'rgba(16, 185, 129, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(249, 115, 22, 0.6)',
            'rgba(239, 68, 68, 0.6)',
          ],
          borderColor: [
            '#10B981',
            '#F59E0B',
            '#F97316',
            '#EF4444'
          ],
          borderWidth: 1,
        },
      ],
    }
    : null;

  return (
    <Layout>
      <div className="space-y-8 px-4 sm:px-0">
        <div className="flex justify-between items-center bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
          <h1 className="text-3xl font-black text-white tracking-[0.2em] flex items-center">
            <span className="w-2 h-8 bg-secondary-500 rounded-full mr-5 shadow-[0_0_20px_theme('colors.secondary.500')]"></span>
            ANALYTICS HUB
          </h1>
          <div className="flex gap-4">
            <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-6">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">System Status</span>
              <span className="text-xs font-mono text-green-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                UPLINK STABLE
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Last Sync</span>
              <span className="text-xs font-mono text-white">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Top Tier Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Total Ops</span>
              <span className="p-2 bg-primary-500/10 rounded-lg text-primary-400 group-hover:scale-110 transition-transform">📊</span>
            </div>
            <p className="text-4xl font-black text-white font-mono mb-1">{missionStats?.overall?.total_missions || 0}</p>
            <div className="flex items-center gap-2 text-xs text-primary-400/60 font-mono">
              <span className="w-3 h-[1px] bg-primary-500/40"></span>
              ALL MISSIONS
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-green-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Success Rate</span>
              <span className="p-2 bg-green-500/10 rounded-lg text-green-400 group-hover:scale-110 transition-transform">🎯</span>
            </div>
            <p className="text-4xl font-black text-green-400 font-mono mb-1">
              {missionStats?.overall?.total_missions > 0
                ? ((missionStats.overall.completed_missions / missionStats.overall.total_missions) * 100).toFixed(0)
                : 0}%
            </p>
            <div className="flex items-center gap-2 text-xs text-green-400/60 font-mono">
              <span className="w-3 h-[1px] bg-green-500/40"></span>
              PRECISION LEVEL
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-secondary-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Fleet Load</span>
              <span className="p-2 bg-secondary-500/10 rounded-lg text-secondary-400 group-hover:scale-110 transition-transform">🛸</span>
            </div>
            <p className="text-4xl font-black text-white font-mono mb-1">{fleetStats?.overview?.total_drones || 0}</p>
            <div className="flex items-center gap-2 text-xs text-secondary-400/60 font-mono">
              <span className="w-3 h-[1px] bg-secondary-500/40"></span>
              ACTIVE ASSETS
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-primary-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">Avg Battery</span>
              <span className="p-2 bg-primary-500/10 rounded-lg text-primary-400 group-hover:scale-110 transition-transform">🔋</span>
            </div>
            <p className="text-4xl font-black text-white font-mono mb-1">
              {parseFloat(fleetStats?.overview?.avg_battery_level || 0).toFixed(0)}%
            </p>
            <div className="flex items-center gap-2 text-xs text-primary-400/60 font-mono">
              <span className="w-3 h-[1px] bg-primary-500/40"></span>
              GLOBAL ENERGY
            </div>
          </div>
        </div>

        {/* Second Row: Charts and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-slate-900/40 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xs font-black text-white/50 tracking-[0.4em] uppercase flex items-center gap-4">
                  <span className="w-8 h-[1px] bg-white/10"></span>
                  Mission Type Distribution
                </h3>
                <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  <span className="w-2 h-2 rounded-full bg-secondary-500"></span>
                  <span className="w-2 h-2 rounded-full bg-accent-500"></span>
                </div>
              </div>
              <div className="h-80">
                {missionTypeData ? (
                  <Bar data={missionTypeData} options={{
                    ...chartOptions,
                    maintainAspectRatio: false,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        beginAtZero: true
                      }
                    }
                  }} />
                ) : (
                  <div className="h-full flex items-center justify-center opacity-20">NO DATA AVAILABLE</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-slate-900/40">
                <h3 className="text-[10px] font-black text-white/40 tracking-[0.4em] uppercase mb-8">Asset Deployment</h3>
                <div className="h-64 flex items-center justify-center">
                  {fleetStatusData ? (
                    <Doughnut data={fleetStatusData} options={{
                      ...chartOptions,
                      cutout: '80%',
                      plugins: {
                        ...chartOptions.plugins,
                        legend: {
                          ...chartOptions.plugins.legend,
                          position: 'bottom'
                        }
                      }
                    }} />
                  ) : <div className="opacity-20">NO SIGNALS</div>}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-slate-900/40">
                <h3 className="text-[10px] font-black text-white/40 tracking-[0.4em] uppercase mb-8">Energy Health</h3>
                <div className="h-64">
                  {batteryDistributionData ? (
                    <Bar data={batteryDistributionData} options={{
                      ...chartOptions,
                      indexAxis: 'y',
                      maintainAspectRatio: false
                    }} />
                  ) : <div className="opacity-20 text-center py-20">NO DATA</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Strategic Intelligence */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Strategic Summary - High Density Hardware Look */}
            <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-slate-900/60 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 blur-3xl rounded-full"></div>
              <h3 className="text-[10px] font-black text-primary-400 tracking-[0.5em] uppercase mb-8 flex items-center justify-between">
                <span>Strategic Summary</span>
                <span className="flex gap-1">
                  <span className="w-1 h-1 bg-primary-500 rounded-full animate-ping"></span>
                  <span className="w-1 h-3 bg-primary-500/20 rounded-full"></span>
                </span>
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div className="relative p-4 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Total Range Covered</span>
                    <span className="text-xl font-mono text-white leading-none">{parseFloat(missionStats?.overall?.total_distance_km || 0).toFixed(1)} <span className="text-[10px] text-gray-500">KM</span></span>
                  </div>
                  <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-600 to-primary-400 w-[85%] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                  </div>
                </div>

                <div className="relative p-4 rounded-xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] text-gray-500 uppercase font-bold tracking-tighter">Mission Success rate</span>
                    <span className="text-xl font-mono text-green-400 leading-none">
                      {missionStats?.overall?.total_missions > 0
                        ? ((missionStats.overall.completed_missions / missionStats.overall.total_missions) * 100).toFixed(0)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex gap-1 h-1">
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className={`flex-1 rounded-full ${i < 9 ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-white/10'}`}></div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[8px] text-gray-500 uppercase block mb-1">Fleet Health</span>
                    <span className="text-xs font-mono text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      OPTIMAL
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[8px] text-gray-500 uppercase block mb-1">Sortie Time</span>
                    <span className="text-xs font-mono text-white">{Math.floor((missionStats?.overall?.avg_duration_seconds || 0) / 60)}m AVG</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[8px] text-gray-500 uppercase block mb-1">Site Coverage</span>
                    <span className="text-xs font-mono text-primary-400">{Math.round(missionStats?.overall?.avg_coverage_percentage || 0)}% AVG</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Log Entry - Terminal / Feed Style */}
            <div className="glass-panel flex-1 rounded-3xl border border-white/10 bg-slate-950/40 overflow-hidden flex flex-col min-h-[500px]">
              <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse"></div>
                  <h3 className="text-xs font-black text-white/60 tracking-[0.4em] uppercase">Operation Logs</h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                  <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
                {/* Visual Scanning Effect */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(255,255,255,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

                {missionStats?.recent && missionStats.recent.length > 0 ? (
                  missionStats.recent.map((mission) => (
                    <Link key={mission.id} href={`/reports/${mission.id}`} className="block">
                      <div className="relative overflow-hidden group cursor-pointer">
                        <div className="absolute left-0 top-0 w-[2px] h-full bg-white/5 group-hover:bg-primary-500 transition-colors"></div>
                        <div className="pl-4 py-2 hover:bg-white/[0.02] transition-colors">
                          <div className="flex justify-between items-start mb-1 text-[10px] font-mono">
                            <span className="text-gray-400 group-hover:text-white transition-colors">
                              [{new Date(mission.createdAt).toLocaleTimeString([], { hour12: false })}] {mission.name}
                            </span>
                            <span className={mission.status === 'completed' ? 'text-green-500/60' : 'text-red-500/60'}>
                              {mission.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex gap-4 text-[9px] font-mono text-gray-500">
                            <span>RANGE_{parseFloat(mission.distance_covered_km || 0).toFixed(2)}KM</span>
                            <span>DUR_{Math.floor((mission.flight_duration_seconds || 0) / 60)}M</span>
                            <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">ACCESS_RECORDS →</span>
                          </div>
                          <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-white/5 to-transparent"></div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-24 text-center">
                    <p className="text-[10px] font-mono text-gray-600 tracking-[0.3em] uppercase animate-pulse">Scanning frequencies...</p>
                  </div>
                )}
              </div>

              {/* Footer terminal info */}
              <div className="p-3 border-t border-white/5 bg-black/40 text-[8px] font-mono text-gray-600 flex justify-between">
                <span>SIG_INT_V4.2</span>
                <span className="animate-pulse">_CURSOR_IDLE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

