/**
 * Waypoint Generation Service
 * Generates waypoints for different mission patterns: grid, perimeter, crosshatch
 */

export class WaypointGenerator {
  /**
   * Generate grid pattern waypoints
   * @param {Object} bounds - {minLat, maxLat, minLng, maxLng}
   * @param {Number} altitude - Flight altitude in meters
   * @param {Number} overlap - Overlap percentage (0-100)
   * @param {Number} spacing - Grid spacing in meters (calculated from overlap if not provided)
   */
  static generateGrid(bounds, altitude, overlap = 70, spacing = null) {
    const { minLat, maxLat, minLng, maxLng } = bounds;
    
    // Calculate grid spacing based on overlap
    // Assuming camera FOV covers ~100m at 50m altitude (adjustable)
    const baseCoverage = altitude * 2; // meters
    const actualSpacing = spacing || (baseCoverage * (1 - overlap / 100));
    
    const waypoints = [];
    let sequence = 0;
    
    // Calculate number of rows and columns
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    
    // Convert lat/lng to approximate meters (rough approximation)
    const latToMeters = 111320; // meters per degree latitude
    const lngToMeters = 111320 * Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
    
    const rows = Math.ceil((latRange * latToMeters) / actualSpacing) + 1;
    const cols = Math.ceil((lngRange * lngToMeters) / actualSpacing) + 1;
    
    // Generate waypoints in a snake pattern
    for (let row = 0; row < rows; row++) {
      const lat = minLat + (row / (rows - 1 || 1)) * latRange;
      const isEvenRow = row % 2 === 0;
      
      if (isEvenRow) {
        // Left to right
        for (let col = 0; col < cols; col++) {
          const lng = minLng + (col / (cols - 1 || 1)) * lngRange;
          waypoints.push({
            sequence_number: sequence++,
            latitude: parseFloat(lat.toFixed(8)),
            longitude: parseFloat(lng.toFixed(8)),
            altitude: parseFloat(altitude.toFixed(2)),
            status: 'pending'
          });
        }
      } else {
        // Right to left
        for (let col = cols - 1; col >= 0; col--) {
          const lng = minLng + (col / (cols - 1 || 1)) * lngRange;
          waypoints.push({
            sequence_number: sequence++,
            latitude: parseFloat(lat.toFixed(8)),
            longitude: parseFloat(lng.toFixed(8)),
            altitude: parseFloat(altitude.toFixed(2)),
            status: 'pending'
          });
        }
      }
    }
    
    return waypoints;
  }

  /**
   * Generate perimeter pattern waypoints
   * @param {Array} polygon - Array of {lat, lng} points defining the perimeter
   * @param {Number} altitude - Flight altitude
   * @param {Number} spacing - Spacing between parallel passes in meters
   */
  static generatePerimeter(polygon, altitude, spacing = 50) {
    // Simplified perimeter: follow the polygon edges
    const waypoints = [];
    
    for (let i = 0; i < polygon.length; i++) {
      waypoints.push({
        sequence_number: i,
        latitude: parseFloat(polygon[i].lat.toFixed(8)),
        longitude: parseFloat(polygon[i].lng.toFixed(8)),
        altitude: parseFloat(altitude.toFixed(2)),
        status: 'pending'
      });
    }
    
    // Close the perimeter
    if (polygon.length > 0) {
      waypoints.push({
        sequence_number: polygon.length,
        latitude: parseFloat(polygon[0].lat.toFixed(8)),
        longitude: parseFloat(polygon[0].lng.toFixed(8)),
        altitude: parseFloat(altitude.toFixed(2)),
        status: 'pending'
      });
    }
    
    return waypoints;
  }

  /**
   * Generate crosshatch pattern waypoints
   * @param {Object} bounds - {minLat, maxLat, minLng, maxLng}
   * @param {Number} altitude - Flight altitude
   * @param {Number} overlap - Overlap percentage
   */
  static generateCrosshatch(bounds, altitude, overlap = 70) {
    const { minLat, maxLat, minLng, maxLng } = bounds;
    
    // Generate diagonal grid pattern
    const waypoints = [];
    let sequence = 0;
    
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    
    // First pass: diagonal from top-left to bottom-right
    const steps = 20; // Number of waypoints per diagonal
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      waypoints.push({
        sequence_number: sequence++,
        latitude: parseFloat((minLat + ratio * latRange).toFixed(8)),
        longitude: parseFloat((minLng + ratio * lngRange).toFixed(8)),
        altitude: parseFloat(altitude.toFixed(2)),
        status: 'pending'
      });
    }
    
    // Second pass: diagonal from top-right to bottom-left
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      waypoints.push({
        sequence_number: sequence++,
        latitude: parseFloat((minLat + ratio * latRange).toFixed(8)),
        longitude: parseFloat((maxLng - ratio * lngRange).toFixed(8)),
        altitude: parseFloat(altitude.toFixed(2)),
        status: 'pending'
      });
    }
    
    return waypoints;
  }

  /**
   * Calculate distance between two waypoints in km
   */
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

