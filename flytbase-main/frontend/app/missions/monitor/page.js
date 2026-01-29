'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { missionsAPI } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import dynamic from 'next/dynamic';
import { LoadingPage, ButtonLoader } from '@/components/Loading';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import LiveMissionMapWrapper from '@/components/LiveMissionMapWrapper';

function LiveMonitorContent() {
  const router = useRouter();
  const [missions, setMissions] = useState([]);
  const [selectedMission, setSelectedMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [controlLoading, setControlLoading] = useState(null); // 'start', 'pause', etc.
  const [socket, setSocket] = useState(null);
  const searchParams = useSearchParams();
  const missionIdFromUrl = searchParams.get('id');
  const selectedMissionIdRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    selectedMissionIdRef.current = selectedMission?.id;
  }, [selectedMission]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadMissions();
    setupSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [router]);

  const setupSocket = () => {
    const sock = getSocket();
    setSocket(sock);

    sock.on('mission:update', (data) => {
      // Use ref to avoid stale closure
      if (data.missionId === selectedMissionIdRef.current) {
        loadMissionDetails(data.missionId);
      }
      loadMissions(); // Refresh list
    });
  };

  const loadMissions = async () => {
    try {
      // Load all missions (not just active ones) so user can see scheduled missions too
      const response = await missionsAPI.getAll();
      // Filter to show active and scheduled missions
      const activeMissions = response.data.filter(m =>
        ['scheduled', 'in-progress', 'paused'].includes(m.status)
      );
      setMissions(activeMissions);

      // Coordination: If ID is in URL, select that mission. Otherwise select first active.
      if (missionIdFromUrl) {
        const urlMission = activeMissions.find(m => m.id === missionIdFromUrl);
        if (urlMission) {
          setSelectedMission(urlMission);
          loadMissionDetails(urlMission.id);
        } else {
          // Fallback: load details even if not in the "active" list filter
          loadMissionDetails(missionIdFromUrl);
        }
      } else if (activeMissions.length > 0 && !selectedMission) {
        setSelectedMission(activeMissions[0]);
        loadMissionDetails(activeMissions[0].id);
      }
    } catch (error) {
      console.error('Failed to load missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMissionDetails = async (missionId) => {
    try {
      const response = await missionsAPI.getById(missionId);
      setSelectedMission(response.data);
      if (socket) {
        socket.emit('mission:subscribe', missionId);
      }
    } catch (error) {
      console.error('Failed to load mission details:', error);
    }
  };

  const handleControl = async (action) => {
    if (!selectedMission) return;

    // Confirm destructive actions
    if (action === 'abort') {
      if (!confirm('Are you sure you want to abort this mission? This action cannot be undone.')) {
        return;
      }
    }

    setControlLoading(action);
    try {
      await missionsAPI.control(selectedMission.id, action);

      // Optimistic Update
      const newStatus = action === 'start' || action === 'resume' ? 'in-progress' :
        action === 'pause' ? 'paused' :
          action === 'abort' ? 'aborted' : selectedMission.status;

      setSelectedMission(prev => ({ ...prev, status: newStatus }));
      setMissions(prev => prev.map(m => m.id === selectedMission.id ? { ...m, status: newStatus } : m));

      toast.success(`Command execution: ${action.toUpperCase()} - Complete`);

      // Secondary fetch for confirmation
      await loadMissionDetails(selectedMission.id);
      await loadMissions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Uplink command failed');
      // Revert on failure
      loadMissionDetails(selectedMission.id);
    } finally {
      setControlLoading(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <LoadingPage message="ESTABLISHING SATELLITE LINK..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-6rem)] flex flex-col gap-4 px-4 sm:px-0">
        {/* Header - Compact */}
        <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white tracking-widest flex items-center">
              <span className="w-2 h-6 bg-red-600 rounded-full mr-3 shadow-[0_0_15px_rgba(220,38,38,0.5)] animate-pulse"></span>
              TACTICAL MONITOR
            </h1>
            {selectedMission && (
              <div className="flex items-center gap-3 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <span className="text-[10px] text-gray-500 font-mono tracking-tighter">OP:</span>
                <span className="text-xs font-bold text-primary-400 font-mono">{selectedMission.name}</span>
                <span className={`h-1.5 w-1.5 rounded-full ${selectedMission.status === 'in-progress' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500'}`}></span>
              </div>
            )}
          </div>
          <Link
            href="/missions"
            className="text-[10px] font-bold text-gray-400 hover:text-white transition-all flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 tracking-[0.2em]"
          >
            ← RETURN TO LOG
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
          {/* Main Tactical Display (Map) */}
          <div className="lg:col-span-3 flex flex-col relative group">
            <div className="glass-panel flex-1 rounded-2xl overflow-hidden border border-white/10 relative shadow-2xl shadow-primary-900/20">
              {/* Map Component */}
              <div className="absolute inset-0 z-0 bg-slate-900/50">
                {selectedMission ? (
                  <LiveMissionMapWrapper mission={selectedMission} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-slate-950/80">
                    <div className="text-6xl mb-4 opacity-10 animate-bounce">🛸</div>
                    <p className="text-sm tracking-[0.3em] font-light">AWAITING UPLINK INITIALIZATION...</p>
                  </div>
                )}
              </div>

              {/* HUD Overlays */}
              {selectedMission && (
                <>
                  {/* Top-Left: Status & Coordinates */}
                  <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-1 h-3 bg-primary-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Telemetry Feed</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px]">
                        <span className="text-gray-500">BATTERY:</span>
                        <span className={selectedMission.drone_id?.battery_level < 20 ? 'text-red-400 animate-pulse' : 'text-green-400'}>
                          {selectedMission.drone_id?.battery_level || '--'}%
                        </span>
                        <span className="text-gray-500">SPEED:</span>
                        <span className="text-white">{(Math.random() * 5 + 10).toFixed(1)} m/s</span>
                        <span className="text-gray-500">ALTITUDE:</span>
                        <span className="text-white">35.4m</span>
                      </div>
                    </div>
                  </div>

                  {/* Top-Right: Progress & Mission Stats */}
                  <div className="absolute top-4 right-4 z-10 pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-2xl w-48">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Progress</span>
                        <span className="text-xs font-mono text-primary-400 font-bold">
                          {parseFloat(selectedMission.progress_percentage || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1 relative overflow-hidden mb-3">
                        <div
                          className="bg-primary-500 h-full shadow-[0_0_10px_#3b82f6]"
                          style={{ width: `${selectedMission.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded p-2 border border-white/5">
                          <span className="text-[8px] text-gray-500 uppercase block">WP DIST</span>
                          <p className="text-xs font-mono text-white">0.4km</p>
                        </div>
                        <div className="bg-white/5 rounded p-2 border border-white/5">
                          <span className="text-[8px] text-gray-500 uppercase block">FLT TIME</span>
                          <p className="text-xs font-mono text-white">{Math.floor((selectedMission.flight_duration_seconds || 0) / 60)}m</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom HUD: Sensor Bar */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[60%] pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-[8px] text-gray-500 uppercase block mb-1">Payload sensors</span>
                          <div className="flex gap-1">
                            {selectedMission.sensor_type?.split(', ').map(s => (
                              <span key={s} className="px-2 py-0.5 bg-secondary-500/10 text-secondary-400 border border-secondary-500/20 text-[8px] rounded uppercase font-bold">
                                {s}
                              </span>
                            )) || <span className="text-[8px] text-gray-600">STBY</span>}
                          </div>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div>
                          <span className="text-[8px] text-gray-500 uppercase block mb-1">Active Streams</span>
                          <div className="flex gap-2">
                            <span className="w-4 h-1 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]"></span>
                            <span className="w-4 h-1 bg-green-500/30 rounded-full"></span>
                            <span className="w-4 h-1 bg-green-500/30 rounded-full"></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                        <div className="text-right">
                          <span className="text-[8px] text-gray-500 uppercase block">Data Packets</span>
                          <p className="text-sm font-mono text-white">
                            {Math.floor((selectedMission.progress_percentage || 0) * (selectedMission.sensor_frequency || 5) * 12).toLocaleString()}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full border-2 border-primary-500/30 flex items-center justify-center animate-spin-slow">
                          <div className="w-1 h-1 bg-primary-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Controls & Operations Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
            {/* Command Center */}
            {selectedMission && (
              <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/20">
                <h3 className="text-xs font-black text-white/40 tracking-[0.3em] uppercase mb-5 flex items-center">
                  <span className="w-4 h-[1px] bg-white/20 mr-3"></span>
                  Uplink Control
                </h3>
                <div className="space-y-3">
                  {selectedMission.status === 'scheduled' && (
                    <button
                      onClick={() => handleControl('start')}
                      disabled={!!controlLoading}
                      className="w-full relative group overflow-hidden px-4 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-[0_10px_20px_rgba(22,163,74,0.3)] flex justify-center items-center gap-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      {controlLoading === 'start' ? <ButtonLoader /> : <><span className="text-lg">▶</span> INITIATE LAUNCH</>}
                    </button>
                  )}
                  {selectedMission.status === 'in-progress' && (
                    <>
                      <button
                        onClick={() => handleControl('pause')}
                        disabled={!!controlLoading}
                        className="w-full px-4 py-4 bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 rounded-xl font-bold hover:bg-yellow-600/30 transition-all flex justify-center items-center gap-2"
                      >
                        {controlLoading === 'pause' ? <ButtonLoader /> : <><span className="text-lg">‖</span> PAUSE OPS</>}
                      </button>
                      <button
                        onClick={() => handleControl('abort')}
                        disabled={!!controlLoading}
                        className="w-full px-4 py-4 bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl font-bold hover:bg-red-600/30 transition-all flex justify-center items-center gap-2"
                      >
                        {controlLoading === 'abort' ? <ButtonLoader /> : <><span className="text-lg">■</span> ABORT MISSION</>}
                      </button>
                    </>
                  )}
                  {selectedMission.status === 'paused' && (
                    <>
                      <button
                        onClick={() => handleControl('resume')}
                        disabled={!!controlLoading}
                        className="w-full px-4 py-4 bg-green-600/20 text-green-400 border border-green-500/30 rounded-xl font-bold hover:bg-green-600/30 transition-all flex justify-center items-center gap-2"
                      >
                        {controlLoading === 'resume' ? <ButtonLoader /> : <><span className="text-lg">▶</span> RESUME OPS</>}
                      </button>
                      <button
                        onClick={() => handleControl('abort')}
                        disabled={!!controlLoading}
                        className="w-full px-4 py-4 bg-red-600/20 text-red-500 border border-red-500/30 rounded-xl font-bold hover:bg-red-600/30 transition-all flex justify-center items-center gap-2"
                      >
                        {controlLoading === 'abort' ? <ButtonLoader /> : <><span className="text-lg">■</span> ABORT MISSION</>}
                      </button>
                    </>
                  )}
                  {(selectedMission.status === 'completed' || selectedMission.status === 'aborted') && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status Finalized</p>
                      <p className={`font-black uppercase tracking-tighter ${selectedMission.status === 'completed' ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedMission.status}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* List */}
            <div className="glass-panel flex-1 rounded-2xl flex flex-col overflow-hidden border border-white/10 bg-slate-900/20">
              <div className="p-4 border-b border-white/5 bg-white/5">
                <h3 className="text-[10px] font-black text-gray-400 tracking-[0.4em] uppercase">Active Uplinks</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {missions.length === 0 ? (
                  <div className="py-20 text-center opacity-20">
                    <p className="text-xs uppercase tracking-widest">No Signals</p>
                  </div>
                ) : (
                  missions.map((mission) => {
                    const isSelected = selectedMission?.id === mission.id;
                    return (
                      <button
                        key={mission.id}
                        onClick={() => {
                          setSelectedMission(mission);
                          loadMissionDetails(mission.id);
                        }}
                        className={`w-full text-left p-4 rounded-xl transition-all duration-300 relative group overflow-hidden ${isSelected
                          ? 'bg-primary-600/20 border border-primary-500/30 shadow-lg shadow-primary-900/20'
                          : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                          }`}
                      >
                        {isSelected && <div className="absolute left-0 top-0 w-1 h-full bg-primary-500 shadow-[0_0_10px_#3b82f6]"></div>}
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold tracking-tight ${isSelected ? 'text-primary-400' : 'text-gray-400'}`}>
                            {mission.name}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${mission.status === 'in-progress' ? 'bg-green-500' : 'bg-white/20'}`}></span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-white/5 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${isSelected ? 'bg-primary-500' : 'bg-gray-500'}`}
                              style={{ width: `${mission.progress_percentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-mono text-gray-500">
                            {Math.round(mission.progress_percentage || 0)}%
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function LiveMonitorPage() {
  return (
    <Suspense fallback={
      <Layout>
        <LoadingPage message="PREPARING TACTICAL INTERFACE..." />
      </Layout>
    }>
      <LiveMonitorContent />
    </Suspense>
  );
}
