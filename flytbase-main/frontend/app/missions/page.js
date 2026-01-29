'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { missionsAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Link from 'next/link';
import { LoadingPage } from '@/components/Loading';
import { toast } from 'react-hot-toast';

export default function MissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadMissions();

    const socket = getSocket();
    socket.on('mission:update', () => {
      loadMissions();
    });

    return () => {
      socket.off('mission:update');
    };
  }, [router, filter]);

  const loadMissions = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await missionsAPI.getAll(params);
      setMissions(response.data);
    } catch (error) {
      console.error('Failed to load missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleControl = async (missionId, action) => {
    if (action === 'abort') {
      if (!confirm('Are you sure you want to abort this mission? This action cannot be undone.')) {
        return;
      }
    }

    setActionLoadingId(`${missionId}_${action}`);
    try {
      await missionsAPI.control(missionId, action);

      // Optimistic Update
      const newStatus = action === 'start' || action === 'resume' ? 'in-progress' :
        action === 'pause' ? 'paused' :
          action === 'abort' ? 'aborted' : 'pending';

      setMissions(prev => prev.map(m => m.id === missionId ? { ...m, status: newStatus } : m));

      toast.success(`Mission ${action} successful`);
      await loadMissions();
    } catch (error) {
      toast.error(error.response?.data?.error || `Failed to ${action} mission`);
      loadMissions(); // Revert on failure
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (missionId) => {
    if (!confirm('Are you sure you want to permanently delete this mission? This cannot be undone.')) {
      return;
    }

    setActionLoadingId(`${missionId}_delete`);
    try {
      await missionsAPI.delete(missionId);
      toast.success('Mission deleted successfully');
      await loadMissions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete mission');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredMissions = missions.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <Layout>
        <LoadingPage message="SYNCING MISSION ARCHIVES..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-0">
        {/* Tactical Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-black/20 p-6 rounded-2xl border border-white/5 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div>
            <p className="text-[10px] font-black text-primary-500 tracking-[0.4em] uppercase mb-1">Fleet Records</p>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Mission Logistics</h1>
            <p className="text-xs text-gray-500 mt-1 font-mono uppercase">Database_V4.0 // Total_Entries: {missions.length}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative group/search flex-1 sm:w-64">
              <input
                type="text"
                placeholder="SEARCH SORTIES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
              />
              <span className="absolute right-3 top-2.5 opacity-20">🔍</span>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 text-primary-400 font-bold rounded-xl px-4 py-2 text-[10px] tracking-widest uppercase focus:ring-1 focus:ring-primary-500 outline-none cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <option value="all">ALL_OPS</option>
              <option value="scheduled">SCHEDULED</option>
              <option value="in-progress">AIRBORNE</option>
              <option value="paused">STALLED</option>
              <option value="completed">ARCHIVED</option>
              <option value="aborted">INTERRUPTED</option>
            </select>

            <Link
              href="/missions/planner"
              className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-black transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <span>+</span> INITIALIZE_OP
            </Link>
          </div>
        </div>

        {/* Missions Table Container */}
        <div className="glass-panel overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-3xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-white/5">
              <thead>
                <tr className="bg-white/[0.02]">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Operation</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Readout</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Efficiency</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Asset</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMissions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <span className="text-6xl mb-4">📡</span>
                        <p className="text-xs font-mono tracking-[0.3em] uppercase">No active signals found in archives</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMissions.map((mission) => (
                    <tr key={mission.id} className="hover:bg-white/[0.03] transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-white text-sm group-hover:text-primary-400 transition-colors uppercase tracking-tight">
                            {mission.name}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono mt-0.5 truncate max-w-[200px]">
                            {mission.description || 'SECURE_CHANNEL_NO_DATA'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${mission.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            mission.status === 'in-progress' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' :
                              mission.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                mission.status === 'aborted' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                          {mission.status === 'in-progress' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-ping"></span>}
                          {mission.status === 'in-progress' ? 'AIRBORNE' : mission.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <div className="w-32 bg-black/40 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${mission.status === 'completed' ? 'bg-primary-500' :
                                  mission.status === 'aborted' ? 'bg-red-500' : 'bg-primary-500 shadow-[0_0_8px_theme("colors.primary.500")]'
                                }`}
                              style={{ width: `${mission.progress_percentage || 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-gray-500">
                            PROG_{parseFloat(mission.progress_percentage || 0).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-sm opacity-60">
                            🛸
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase">{mission.drone_id?.name || 'UNASSIGNED'}</span>
                            <span className="text-[9px] font-mono text-gray-500">{mission.drone_id?.serial_number || '---'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          {mission.status === 'scheduled' && (
                            <button
                              onClick={() => handleControl(mission.id, 'start')}
                              disabled={!!actionLoadingId && actionLoadingId.startsWith(mission.id)}
                              className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center hover:bg-green-500/20 transition-all"
                              title="START_OP"
                            >
                              ▶️
                            </button>
                          )}
                          {mission.status === 'in-progress' && (
                            <>
                              <button
                                onClick={() => handleControl(mission.id, 'pause')}
                                disabled={!!actionLoadingId && actionLoadingId.startsWith(mission.id)}
                                className="w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center justify-center hover:bg-yellow-500/20 transition-all"
                                title="PAUSE_OP"
                              >
                                ⏸️
                              </button>
                            </>
                          )}
                          {(mission.status === 'in-progress' || mission.status === 'paused') && (
                            <button
                              onClick={() => handleControl(mission.id, 'abort')}
                              disabled={!!actionLoadingId && actionLoadingId.startsWith(mission.id)}
                              className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all"
                              title="ABORT_OP"
                            >
                              ⛔
                            </button>
                          )}
                          {mission.status === 'paused' && (
                            <button
                              onClick={() => handleControl(mission.id, 'resume')}
                              disabled={!!actionLoadingId && actionLoadingId.startsWith(mission.id)}
                              className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center hover:bg-green-500/20 transition-all"
                              title="RESUME_OP"
                            >
                              ▶️
                            </button>
                          )}
                          <Link
                            href={`/reports/${mission.id}`}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-gray-400 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
                            title="ACCESS_REPORTS"
                          >
                            📑
                          </Link>
                          <Link
                            href={`/missions/monitor?id=${mission.id}`}
                            className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20 flex items-center justify-center hover:bg-primary-500/20 transition-all"
                            title="LIVE_MONITOR"
                          >
                            📡
                          </Link>
                          <button
                            onClick={() => handleDelete(mission.id)}
                            disabled={!!actionLoadingId && actionLoadingId.startsWith(mission.id)}
                            className="w-8 h-8 rounded-lg bg-red-900/20 text-red-500 border border-red-500/20 flex items-center justify-center hover:bg-red-900/40 transition-all"
                            title="WIPE_ENTRY"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
