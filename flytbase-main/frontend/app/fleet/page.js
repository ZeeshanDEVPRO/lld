'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { fleetAPI } from '@/lib/api';
import { LoadingPage, ButtonLoader } from '@/components/Loading';
import { toast } from 'react-hot-toast';

export default function FleetPage() {
  const router = useRouter();
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDrone, setNewDrone] = useState({
    name: '',
    serial_number: '',
    model: '',
    location: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadDrones();
  }, [router, filter]);

  const loadDrones = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await fleetAPI.getAll(params);
      setDrones(response.data);
    } catch (error) {
      console.error('Failed to load drones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async (droneId) => {
    setActionLoadingId(`${droneId}_recharge`);
    try {
      await fleetAPI.recharge(droneId);
      toast.success('Battery Recharging Initiated');
      await loadDrones();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Recharge protocol failure');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMaintenance = async (droneId) => {
    setActionLoadingId(`${droneId}_maintenance`);
    try {
      await fleetAPI.maintenance(droneId);
      toast.success('Maintenance Protocol Completed');
      await loadDrones();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Maintenance sequence failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (droneId) => {
    if (!confirm('DECOMMISSION WARNING: Are you sure you want to permanently drop this unit from the fleet?')) {
      return;
    }

    setActionLoadingId(`${droneId}_delete`);
    try {
      await fleetAPI.delete(droneId);
      toast.success('Unit Decommissioned Successfully');
      await loadDrones();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Decommissioning protocol failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddDrone = async (e) => {
    e.preventDefault();
    setActionLoadingId('adding_drone');
    try {
      await fleetAPI.create(newDrone);
      toast.success('New Unit Employed Successfully');
      setShowAddForm(false);
      setNewDrone({ name: '', serial_number: '', model: '', location: '' });
      await loadDrones();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Employment protocol failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'idle':
        return 'bg-green-100 text-green-800';
      case 'in-mission':
        return 'bg-blue-100 text-blue-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBatteryColor = (level) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 50) return 'text-yellow-600';
    if (level >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Layout>
        <LoadingPage message="SCANNING FLEET SIGNALS..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <span className="w-1 h-8 bg-primary-500 rounded mr-4 shadow-[0_0_10px_theme('colors.primary.500')]"></span>
            Fleet Command
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${showAddForm ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-primary-600 hover:bg-primary-500 text-white shadow-[0_0_10px_theme("colors.primary.900")]'}`}
            >
              <span>{showAddForm ? '✕' : '+'}</span> {showAddForm ? 'CANCEL' : 'EMPLOY DRONE'}
            </button>
            <button
              onClick={async () => {
                try {
                  setLoading(true);
                  await fleetAPI.expandFleet();
                  toast.success('Reinforcements Deployed Successfully');
                  await loadDrones();
                } catch (error) {
                  toast.error('Expansion Protocol Failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="px-4 py-2 bg-secondary-600 hover:bg-secondary-500 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_10px_theme('colors.secondary.700')] flex items-center gap-2"
            >
              <span>🛸</span> DEPLOY REINFORCEMENTS
            </button>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-surface border border-white/10 text-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="all">All Units</option>
              <option value="idle">Idle</option>
              <option value="in-mission">In Mission</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {showAddForm && (
          <div className="glass-panel p-6 rounded-xl animate-fadeIn border border-primary-500/30 shadow-[0_0_20px_theme('colors.primary.900/20')]">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <span className="w-1 h-6 bg-primary-500 rounded mr-3"></span>
              New Unit Specification
            </h2>
            <form onSubmit={handleAddDrone} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Callsign</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="e.g. Vulcan-1"
                  value={newDrone.name}
                  onChange={(e) => setNewDrone({ ...newDrone, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Serial ID</label>
                <input
                  type="text"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="SN-XXXX"
                  value={newDrone.serial_number}
                  onChange={(e) => setNewDrone({ ...newDrone, serial_number: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Platform Model</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Mavic 3 / M300"
                  value={newDrone.model}
                  onChange={(e) => setNewDrone({ ...newDrone, model: e.target.value })}
                />
              </div>
              <div>
                <button
                  type="submit"
                  disabled={actionLoadingId === 'adding_drone'}
                  className="w-full h-10 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_theme('colors.primary.900')] flex items-center justify-center"
                >
                  {actionLoadingId === 'adding_drone' ? <ButtonLoader /> : 'INITIALIZE EMPLOYMENT'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {drones.map((drone) => (
            <div key={drone.id} className="glass-card p-6 flex flex-col group transition-all duration-300 hover:bg-white/10 hover:shadow-[0_0_20px_theme('colors.primary.900')]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-primary-400 transition-colors flex items-center">
                  <span className="mr-2 opacity-50">🛸</span> {drone.name}
                </h3>
                <span className={`px-2.5 py-0.5 text-xs font-mono font-medium rounded border ${drone.status === 'idle' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                  drone.status === 'in-mission' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse' :
                    drone.status === 'offline' ? 'bg-gray-500/10 text-gray-400 border-gray-500/30' :
                      'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  }`}>
                  {drone.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 uppercase">Serial No.</span>
                    <p className="font-mono text-sm text-gray-300">{drone.serial_number}</p>
                  </div>
                  {drone.model && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase">Model</span>
                      <p className="font-mono text-sm text-gray-300">{drone.model}</p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-500 uppercase">Battery Level</span>
                    <span className={`text-xs font-mono ${getBatteryColor(drone.battery_level)}`}>
                      {drone.battery_level}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full shadow-[0_0_8px_currentColor] transition-all duration-1000 ${drone.battery_level >= 50 ? 'bg-green-500 text-green-500' : drone.battery_level >= 20 ? 'bg-yellow-500 text-yellow-500' : 'bg-red-500 text-red-500'
                        }`}
                      style={{ width: `${drone.battery_level}%` }}
                    />
                  </div>
                </div>

                {drone.active_mission && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-xs text-primary-400 uppercase mb-1 block">Active Mission</span>
                    <p className="font-medium text-white text-sm truncate">{drone.active_mission.name}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-800 h-1 rounded-full">
                        <div className="bg-primary-500 h-1 rounded-full" style={{ width: `${drone.active_mission.progress_percentage || 0}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        {parseFloat(drone.active_mission.progress_percentage || 0).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 mt-auto border-t border-white/10 flex justify-between items-end">
                  <div>
                    <span className="text-xs text-gray-500 uppercase block">System Health</span>
                    <p className={`font-mono text-sm capitalize flex items-center ${drone.health_status === 'healthy' ? 'text-green-400' :
                      drone.health_status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${drone.health_status === 'healthy' ? 'bg-green-400 shadow-[0_0_5px_theme("colors.green.400")]' :
                        drone.health_status === 'warning' ? 'bg-yellow-400 shadow-[0_0_5px_theme("colors.yellow.400")]' : 'bg-red-400 shadow-[0_0_5px_theme("colors.red.400")]'
                        }`}></span>
                      {drone.health_status}
                    </p>
                  </div>
                  {drone.location && (
                    <div className="text-right">
                      <span className="text-xs text-gray-500 uppercase block">Base</span>
                      <p className="font-mono text-sm text-gray-300">{drone.location}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 grid grid-cols-2 gap-3 border-t border-white/5 transition-all duration-300">
                  <button
                    onClick={() => handleRecharge(drone.id)}
                    disabled={!!actionLoadingId || drone.status === 'in-mission' || drone.battery_level === 100}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-2 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg hover:bg-primary-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-bold"
                  >
                    {actionLoadingId === `${drone.id}_recharge` ? <ButtonLoader /> : (
                      <>
                        <span className="text-sm">⚡</span>
                        <span>RECHARGE</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleMaintenance(drone.id)}
                    disabled={!!actionLoadingId || drone.status === 'in-mission'}
                    className="flex flex-col items-center justify-center gap-1 px-3 py-2 bg-secondary-500/10 text-secondary-400 border border-secondary-500/20 rounded-lg hover:bg-secondary-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-bold"
                  >
                    {actionLoadingId === `${drone.id}_maintenance` ? <ButtonLoader /> : (
                      <>
                        <span className="text-sm">🛠️</span>
                        <span>FIX UNIT</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleDelete(drone.id)}
                    disabled={!!actionLoadingId || drone.status === 'in-mission'}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[10px] font-bold tracking-widest"
                  >
                    {actionLoadingId === `${drone.id}_delete` ? <ButtonLoader /> : (
                      <>
                        <span className="text-sm">☢️</span>
                        <span>DROP UNIT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {drones.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 opacity-10">🛸</div>
            <div className="text-gray-500 text-lg">No active drone signals detected</div>
          </div>
        )}
      </div>
    </Layout>
  );
}

