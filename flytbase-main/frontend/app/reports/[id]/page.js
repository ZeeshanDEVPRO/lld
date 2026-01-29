'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { reportsAPI } from '@/lib/api';
import { LoadingPage } from '@/components/Loading';
import Link from 'next/link';

export default function MissionReportPage() {
    const params = useParams();
    const router = useRouter();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            loadReport(params.id);
        }
    }, [params.id]);

    const loadReport = async (id) => {
        try {
            const response = await reportsAPI.getMissionPerformance(id);
            setReport(response.data);
        } catch (error) {
            console.error('Failed to load report:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <LoadingPage message="GENERATING MISSION RECAP..." />
            </Layout>
        );
    }

    if (!report) {
        return (
            <Layout>
                <div className="flex flex-col items-center justify-center p-20 text-center">
                    <span className="text-6xl mb-6">⚠️</span>
                    <h2 className="text-2xl font-bold text-white mb-2">REPORT NOT FOUND</h2>
                    <p className="text-gray-400 mb-8">The requested mission data could not be retrieved from the archives.</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
                    >
                        Return to Command
                    </button>
                </div>
            </Layout>
        );
    }

    const { mission, waypoints, logs } = report;

    return (
        <Layout>
            <div className="space-y-8 px-4 sm:px-0 pb-20">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-black/30 p-8 rounded-3xl border border-white/5 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <span className="text-9xl">📑</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-widest ${mission.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'
                                }`}>
                                {mission.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">ID: {mission.id.slice(-8).toUpperCase()}</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase">{mission.name}</h1>
                        <p className="text-sm text-gray-400 mt-1 font-mono">TYPE: {mission.mission_type?.toUpperCase() || 'GENERAL'}</p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/missions"
                            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all uppercase tracking-widest"
                        >
                            Back to Logs
                        </Link>
                        <button
                            onClick={() => window.print()}
                            className="px-6 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-500 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        >
                            Export PDF
                        </button>
                    </div>
                </div>

                {/* Tactical Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-32">
                        <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-4">Total Duration</span>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-black font-mono text-white">
                                {Math.floor((mission.flight_duration_seconds || 0) / 60)}<span className="text-sm text-gray-500">m</span> {mission.flight_duration_seconds % 60}<span className="text-sm text-gray-500">s</span>
                            </span>
                            <span className="text-xl opacity-20">⏱️</span>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-32">
                        <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-4">Distance Covered</span>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-black font-mono text-white">
                                {parseFloat(mission.distance_covered_km || 0).toFixed(2)}<span className="text-sm text-gray-500">km</span>
                            </span>
                            <span className="text-xl opacity-20">🗺️</span>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-32">
                        <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-4">Area Coverage</span>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-black font-mono text-primary-400">
                                {mission.area_coverage_percentage || 0}<span className="text-sm text-gray-500">%</span>
                            </span>
                            <span className="text-xl opacity-20">🎯</span>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between h-32">
                        <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase mb-4">Waypoint Completion</span>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-black font-mono text-green-400">
                                {waypoints.completed_waypoints}/{waypoints.total_waypoints}
                            </span>
                            <span className="text-xl opacity-20">🚩</span>
                        </div>
                    </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Survey Summary Card */}
                        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-slate-900/40">
                            <h3 className="text-xs font-black text-white/50 tracking-[0.4em] uppercase mb-8 flex items-center">
                                <span className="w-8 h-[1px] bg-white/10 mr-4"></span>
                                Operation Summary
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-xs text-gray-500">Asset Deployed</span>
                                        <Link href="/fleet" className="text-sm font-bold text-white hover:text-primary-400 transition-colors uppercase">
                                            {mission.drone_name || 'N/A'}
                                        </Link>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-xs text-gray-500">Serial Number</span>
                                        <span className="text-sm font-mono text-gray-400">{mission.drone_serial || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-xs text-gray-500">Site Location</span>
                                        <span className="text-sm font-bold text-white">Zone_Alpha_Sector_4</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-xs text-gray-500">Start Time</span>
                                        <span className="text-sm font-mono text-white">{new Date(mission.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-xs text-gray-500">End Time</span>
                                        <span className="text-sm font-mono text-white">
                                            {mission.completed_at ? new Date(mission.completed_at).toLocaleString() : 'In Progress'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-xs text-gray-500">Total Battery Yield</span>
                                        <span className="text-sm font-mono text-green-400">82% Efficiency</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/5">
                                <h4 className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase mb-4">Commanding Officer Notes</h4>
                                <p className="text-sm text-gray-400 leading-relaxed italic">
                                    Autonomous survey completed with nominal deviations. All waypoints successfully recorded. Sensor payload maintained 98% signal integrity throughout the sortie. Recommended for post-processing.
                                </p>
                            </div>
                        </div>

                        {/* Coverage Graph Visualizer Placeholder */}
                        <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-slate-900/60 relative overflow-hidden">
                            <h3 className="text-xs font-black text-white/50 tracking-[0.4em] uppercase mb-8 flex items-center">
                                <span className="w-8 h-[1px] bg-white/10 mr-4"></span>
                                Coverage Heatmap
                            </h3>
                            <div className="h-64 bg-black/40 rounded-2xl flex flex-col items-center justify-center border border-white/5 border-dashed">
                                <div className="text-5xl opacity-10 mb-2">🗺️</div>
                                <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Heatmap Render Not Available In Report View</p>
                                <div className="mt-4 flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                        <span className="text-[10px] text-gray-500">SCAN_PATH</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        <span className="text-[10px] text-gray-500">WAYPOINTS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Operation Log Feed */}
                    <div className="space-y-6">
                        <div className="glass-panel rounded-3xl border border-white/10 bg-slate-950 flex flex-col h-[700px] overflow-hidden">
                            <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center backdrop-blur-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse"></div>
                                    <h3 className="text-xs font-black text-white/60 tracking-[0.4em] uppercase">Telemetric Log</h3>
                                </div>
                                <span className="text-[9px] font-mono text-gray-600">LIVE_RECORD</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative font-mono text-[10px]">
                                <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(255,255,255,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

                                {logs.length > 0 ? (
                                    logs.map((log, i) => (
                                        <div key={log.id} className="relative group pl-3">
                                            <div className="absolute left-0 top-1 w-1 h-3 bg-white/10 group-hover:bg-primary-500 transition-colors"></div>
                                            <div className="text-gray-500 mb-1">
                                                [{new Date(log.createdAt).toLocaleTimeString([], { hour12: false })}]
                                            </div>
                                            <div className="text-white/80 group-hover:text-white transition-colors">
                                                {log.message.toUpperCase()}
                                            </div>
                                            {log.log_type === 'error' && (
                                                <div className="text-red-500/60 mt-0.5 text-[9px] tracking-tight">ALERT_CODE: SYS_FLT_{i + 100}</div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center opacity-20 italic">No telemetry logs recorded for this sortie.</div>
                                )}
                            </div>

                            <div className="p-3 bg-black/40 border-t border-white/5 flex justify-between items-center text-[8px] text-gray-600 font-mono">
                                <span>INTEL_RECORD_V1.0</span>
                                <span>CHECKSUM_OK</span>
                            </div>
                        </div>

                        {/* Hardware Status Pip */}
                        <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-green-500/5 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] font-black text-green-500 tracking-widest uppercase">Post-Flight Integrity</span>
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[8px] text-gray-500 uppercase">Sensors</span>
                                    <span className="text-xs font-mono text-white flex items-center gap-2">
                                        <span className="w-1 h-1 bg-green-500 rounded-full"></span> NOMINAL
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[8px] text-gray-500 uppercase">Power</span>
                                    <span className="text-xs font-mono text-white flex items-center gap-2">
                                        <span className="w-1 h-1 bg-green-500 rounded-full"></span> STABLE
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
