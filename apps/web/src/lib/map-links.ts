type MapAddress = {
  line1?: string | null;
  barangay?: string | null;
  municipality?: string | null;
  province?: string | null;
  landmark?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
};

export function formatAddressForMap(address: MapAddress) {
  return [
    address.line1,
    address.barangay,
    address.municipality,
    address.province,
    address.landmark,
  ]
    .filter(Boolean)
    .join(', ');
}

export function buildGoogleMapsSearchUrl(address: MapAddress) {
  const latitude = address.latitude;
  const longitude = address.longitude;

  if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${latitude},${longitude}`,
    )}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    formatAddressForMap(address),
  )}`;
}

export function buildGoogleMapsDirectionsUrl(destination: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination,
  )}`;
}
