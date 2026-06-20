import * as Location from 'expo-location';

export interface CaptureLocation {
  latitude: number;
  longitude: number;
  name?: string;
}

/**
 * Best-effort location at capture time (foreground only — we never track in the
 * background). Returns null if permission is denied or it fails, so capture is
 * never blocked. The place name feeds the map "memory" and the AI diary.
 */
export async function getCaptureLocation(): Promise<CaptureLocation | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = pos.coords;
    let name: string | undefined;
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        // Prefer a human "district · street" style label.
        name = [place.city ?? place.region, place.district ?? place.street ?? place.name]
          .filter(Boolean)
          .join(' · ') || undefined;
      }
    } catch {
      /* reverse geocode is optional */
    }
    return { latitude, longitude, name };
  } catch {
    return null;
  }
}
