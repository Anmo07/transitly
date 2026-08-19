const crypto = require('crypto');

/**
 * Generates a cryptographically secure numeric OTP string.
 * @param {number} length - Number of digits (default: 6)
 * @returns {string} OTP code
 */
const generateOtp = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
};

/**
 * Hashes an OTP using SHA-256 with optional salt.
 * @param {string} otp 
 * @param {string} [salt]
 * @returns {string} Hex hash
 */
const hashOtp = (otp, salt = '') => {
  return crypto.createHash('sha256').update(`${otp}:${salt}`).digest('hex');
};

/**
 * Verifies if an input OTP matches the stored hash.
 * @param {string} inputOtp 
 * @param {string} storedHash 
 * @param {string} [salt]
 * @returns {boolean}
 */
const verifyOtp = (inputOtp, storedHash, salt = '') => {
  if (!inputOtp || !storedHash) return false;
  const hash = hashOtp(inputOtp, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
};

/**
 * Generates a unique, tamper-evident QR seal code.
 * @returns {string} QR Seal Code (e.g. SEAL-9A2F8B1C-3E4D)
 */
const generateQrSealCode = () => {
  const token = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `SEAL-${token.slice(0, 4)}-${token.slice(4, 8)}-${token.slice(8, 12)}`;
};

/**
 * Calculates great-circle distance between two GPS coordinates in meters (Haversine formula).
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters
 */
const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Validates whether current coordinates fall within an authorized geofence radius.
 * @param {{latitude: number, longitude: number}} currentCoord 
 * @param {{latitude: number, longitude: number, radiusMeters?: number}} targetGeofence 
 * @param {number} [defaultRadius=100] 
 * @returns {{isWithinGeofence: boolean, distanceMeters: number}}
 */
const validateGeofence = (currentCoord, targetGeofence, defaultRadius = 100) => {
  if (!currentCoord || !targetGeofence) {
    return { isWithinGeofence: false, distanceMeters: Infinity };
  }

  const radius = targetGeofence.radiusMeters || defaultRadius;
  const distanceMeters = calculateDistanceMeters(
    currentCoord.latitude,
    currentCoord.longitude,
    targetGeofence.latitude,
    targetGeofence.longitude
  );

  return {
    isWithinGeofence: distanceMeters <= radius,
    distanceMeters: Math.round(distanceMeters * 100) / 100
  };
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
  generateQrSealCode,
  calculateDistanceMeters,
  validateGeofence
};
