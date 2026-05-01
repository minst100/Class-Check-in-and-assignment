function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function haversineMeters(a, b) {
  const earthRadius = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

function validateGeofence(session, location) {
  if (session.geo_required && !location) {
    return { ok: false, reasonCode: 'geo_required' };
  }
  if (!location || !session.location_lat || !session.location_lng || !session.allowed_radius_meters) {
    return { ok: true, distanceMeters: null };
  }

  const distanceMeters = haversineMeters(
    { lat: Number(session.location_lat), lng: Number(session.location_lng) },
    { lat: Number(location.lat), lng: Number(location.lng) }
  );
  if (distanceMeters > Number(session.allowed_radius_meters)) {
    return { ok: false, reasonCode: 'outside_geofence', distanceMeters };
  }
  return { ok: true, distanceMeters };
}

module.exports = { haversineMeters, validateGeofence };
