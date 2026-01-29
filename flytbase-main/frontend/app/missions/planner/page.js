'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { missionsAPI, fleetAPI } from '@/lib/api';
import dynamic from 'next/dynamic';
import { ButtonLoader } from '@/components/Loading';
import { toast } from 'react-hot-toast';

import MissionMapWrapper from '@/components/MissionMapWrapper';

export default function MissionPlannerPage() {
  const router = useRouter();
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    drone_id: '',
    mission_type: 'grid',
    altitude: 50,
    overlap_percentage: 70,
    sensor_type: '',
    sensor_frequency: '',
    survey_area: null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadDrones();
  }, [router]);

  const loadDrones = async () => {
    try {
      const response = await fleetAPI.getAll({ status: 'idle' });
      setDrones(response.data);
    } catch (error) {
      console.error('Failed to load drones:', error);
    }
  };

  const handleAreaSelected = useCallback((area) => {
    setFormData(prev => ({ ...prev, survey_area: area }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.survey_area) {
        toast.error('Tactical Boundary Error: Survey area required');
        setLoading(false);
        return;
      }

      const missionData = {
        ...formData,
        survey_area_polygon: {
          coordinates: formData.survey_area.coordinates,
          bounds: formData.survey_area.bounds,
        },
      };

      await missionsAPI.create(missionData);
      toast.success('Mission Blueprint Uploaded Successfully');
      router.push('/missions');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Protocol Failure: Mission creation rejected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-0">
        <h1 className="text-3xl font-bold text-white tracking-tight">Mission Planner</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass-panel p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-1 h-6 bg-primary-500 rounded mr-3 shadow-[0_0_8px_theme('colors.primary.500')]"></span>
              Mission Details
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mission Name</label>
                <input
                  type="text"
                  required
                  className="block w-full bg-white/5 border border-white/10 rounded-lg shadow-sm py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="e.g. Sector 7 Surveillance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Assign Drone</label>
                <select
                  className="block w-full bg-white/5 border border-white/10 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all [&>option]:bg-gray-900"
                  value={formData.drone_id}
                  onChange={(e) => setFormData({ ...formData, drone_id: e.target.value })}
                >
                  <option value="">Select a drone</option>
                  {drones.map((drone) => (
                    <option key={drone.id} value={drone.id}>
                      {drone.name} ({drone.serial_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Mission Type</label>
                <select
                  required
                  className="block w-full bg-white/5 border border-white/10 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all [&>option]:bg-gray-900"
                  value={formData.mission_type}
                  onChange={(e) => setFormData({ ...formData, mission_type: e.target.value })}
                >
                  <option value="grid">Grid Pattern</option>
                  <option value="perimeter">Perimeter</option>
                  <option value="crosshatch">Crosshatch</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Altitude (meters)
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="500"
                  className="block w-full bg-white/5 border border-white/10 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.altitude}
                  onChange={(e) => setFormData({ ...formData, altitude: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Overlap Percentage
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  className="block w-full bg-white/5 border border-white/10 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  value={formData.overlap_percentage}
                  onChange={(e) => setFormData({ ...formData, overlap_percentage: parseFloat(e.target.value) })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                <textarea
                  className="block w-full bg-white/5 border border-white/10 rounded-lg shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  rows="1"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Data Collection Frequency (Hz)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      className="flex-1 accent-primary-500"
                      value={formData.sensor_frequency || 5}
                      onChange={(e) => setFormData({ ...formData, sensor_frequency: parseInt(e.target.value) })}
                    />
                    <span className="text-primary-400 font-mono w-12 text-right">{formData.sensor_frequency || 5} Hz</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Active Sensors</label>
                  <div className="flex flex-wrap gap-3">
                    {['RGB Camera', 'Thermal', 'LiDAR', 'Multispectral'].map((sensor) => {
                      const isSelected = formData.sensor_type?.includes(sensor);
                      return (
                        <button
                          key={sensor}
                          type="button"
                          onClick={() => {
                            const current = formData.sensor_type ? formData.sensor_type.split(', ') : [];
                            const next = isSelected
                              ? current.filter(s => s !== sensor)
                              : [...current, sensor];
                            setFormData({ ...formData, sensor_type: next.join(', ') });
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isSelected
                            ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                        >
                          {sensor}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <span className="w-1 h-6 bg-secondary-500 rounded mr-3 shadow-[0_0_8px_theme('colors.secondary.500')]"></span>
              Survey Area
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                  <p className="text-sm text-primary-400 font-medium mb-2 flex items-center">
                    <span className="mr-2">ℹ️</span> Instructions
                  </p>
                  <ol className="text-sm text-gray-400 list-decimal list-inside space-y-1 ml-1">
                    <li>Click map to add points</li>
                    <li>Need at least 3 points</li>
                    <li>Shape closes automatically</li>
                    <li>Correct positions if needed</li>
                  </ol>
                </div>

                {formData.survey_area ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 animate-fadeIn">
                    <p className="text-sm text-green-400 flex items-center">
                      <span className="mr-2">✅</span> Area Defined
                    </p>
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                      {formData.survey_area.coordinates.length} vertices captured
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-sm text-yellow-400 flex items-center">
                      <span className="mr-2">⚠️</span> Area Pending
                    </p>
                    <p className="text-xs text-gray-400 mt-1 ml-6">
                      Please define the survey polygon on the map.
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-2 h-96 w-full rounded-lg overflow-hidden border border-white/10 relative shadow-2xl">
                <MissionMapWrapper
                  onAreaSelected={handleAreaSelected}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2.5 border border-white/10 rounded-lg shadow-sm text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 border border-transparent rounded-lg shadow-[0_0_15px_theme('colors.primary.600')] text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <ButtonLoader /> : 'Confirm Mission'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
