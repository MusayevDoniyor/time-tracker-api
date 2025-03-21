export function calculateMinutes(fixedTime, actualTime = Date.now) {
  console.log(fixedTime, actualTime);
  const [fixedHour, fixedMin] = fixedTime.split(":").map(Number);
  const [actualHour, actualMin] = actualTime.split(":").map(Number);

  const fixedMinutes = fixedHour * 60 + fixedMin;
  const actualMinutes = actualHour * 60 + actualMin;

  console.log(actualMinutes - fixedMinutes, 0);
  return Math.max(actualMinutes - fixedMinutes, 0); // Faqat kech qolgan vaqtni olamiz
}

export function getDistance(loc1, loc2) {
  const R = 6371; // Yer radiusi (km)

  const lat1 = loc1.lat * (Math.PI / 180);
  const lat2 = loc2.lat * (Math.PI / 180);

  const deltaLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const deltaLon = (loc2.lng - loc1.lng) * (Math.PI / 180);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Masofa (km)
}
