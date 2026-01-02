// src/hooks/useLocation.ts
// Hook para obtener la ubicación del dispositivo y departamentos cercanos

import { useState, useEffect, useCallback } from "react";
import * as ExpoLocation from "expo-location";

// ============================================
// TIPOS
// ============================================
export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  departamento: string | null;
  municipio: string | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export interface NearbyDepartamento {
  departamento: string;
  distance: number;
}

// ============================================
// API DIVIPOLA
// ============================================
const DIVIPOLA_API = "https://www.datos.gov.co/resource/gdxc-w37w.json";

// Cache de coordenadas de departamentos
let departamentosCache: Map<string, { lat: number; lng: number }> | null = null;

// ============================================
// CARGAR COORDENADAS DE DEPARTAMENTOS
// ============================================
const loadDepartamentosCoords = async (): Promise<
  Map<string, { lat: number; lng: number }>
> => {
  if (departamentosCache) return departamentosCache;

  try {
    const response = await fetch(
      `${DIVIPOLA_API}?$select=dpto,avg(latitud) as lat,avg(longitud) as lng&$group=dpto`,
      {
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) {
      console.log("Error cargando coordenadas, usando fallback");
      return FALLBACK_COORDS;
    }

    const data: { dpto: string; lat: string; lng: string }[] =
      await response.json();

    departamentosCache = new Map();
    data.forEach((d) => {
      if (d.lat && d.lng) {
        departamentosCache!.set(d.dpto, {
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lng),
        });
      }
    });

    return departamentosCache;
  } catch (error) {
    console.error("Error loading departamentos coords:", error);
    return FALLBACK_COORDS;
  }
};

// ============================================
// CALCULAR DISTANCIA (Haversine)
// ============================================
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ============================================
// OBTENER DEPARTAMENTOS CERCANOS
// ============================================
export const getNearbyDepartamentos = async (
  lat: number,
  lng: number,
  radiusKm: number = 250
): Promise<NearbyDepartamento[]> => {
  const coords = await loadDepartamentosCoords();
  const nearby: NearbyDepartamento[] = [];

  coords.forEach((deptCoords, departamento) => {
    const distance = calculateDistance(
      lat,
      lng,
      deptCoords.lat,
      deptCoords.lng
    );
    if (distance <= radiusKm) {
      nearby.push({ departamento, distance });
    }
  });

  nearby.sort((a, b) => a.distance - b.distance);

  return nearby;
};

// ============================================
// ENCONTRAR DEPARTAMENTO MÁS CERCANO
// ============================================
const findNearestDepartamento = async (
  lat: number,
  lng: number
): Promise<string | null> => {
  const coords = await loadDepartamentosCoords();
  let nearestDept: string | null = null;
  let nearestDistance = Infinity;

  coords.forEach((deptCoords, departamento) => {
    const distance = calculateDistance(
      lat,
      lng,
      deptCoords.lat,
      deptCoords.lng
    );
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestDept = departamento;
    }
  });

  return nearestDept;
};

// ============================================
// HOOK PRINCIPAL
// ============================================
export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    departamento: null,
    municipio: null,
    loading: true,
    error: null,
    permissionDenied: false,
  });

  const [nearbyDepartamentos, setNearbyDepartamentos] = useState<
    NearbyDepartamento[]
  >([]);

  const getLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setState((prev) => ({
          ...prev,
          loading: false,
          permissionDenied: true,
          error: "Permiso de ubicación denegado",
        }));
        return;
      }

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      const departamento = await findNearestDepartamento(latitude, longitude);

      const nearby = await getNearbyDepartamentos(latitude, longitude, 250);
      setNearbyDepartamentos(nearby);

      let municipio: string | null = null;
      try {
        const [address] = await ExpoLocation.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (address) {
          municipio = address.city || address.subregion || null;
        }
      } catch (geocodeError) {
        console.log("Error en geocoding:", geocodeError);
      }

      setState({
        latitude,
        longitude,
        departamento,
        municipio,
        loading: false,
        error: null,
        permissionDenied: false,
      });
    } catch (error) {
      // Si el módulo no está disponible o hay error, terminar sin error crítico
      console.log("Ubicación no disponible:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: null, // No mostrar error al usuario, simplemente no filtra por ubicación
      }));
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {
    ...state,
    nearbyDepartamentos,
    refreshLocation: getLocation,
  };
};

// ============================================
// FALLBACK COORDS
// ============================================
const FALLBACK_COORDS = new Map<string, { lat: number; lng: number }>([
  ["AMAZONAS", { lat: -1.0, lng: -71.9 }],
  ["ANTIOQUIA", { lat: 6.25, lng: -75.56 }],
  ["ARAUCA", { lat: 7.08, lng: -70.76 }],
  ["ATLÁNTICO", { lat: 10.96, lng: -74.78 }],
  ["BOGOTÁ, D.C.", { lat: 4.71, lng: -74.07 }],
  ["BOLÍVAR", { lat: 10.39, lng: -75.51 }],
  ["BOYACÁ", { lat: 5.53, lng: -73.36 }],
  ["CALDAS", { lat: 5.07, lng: -75.52 }],
  ["CAQUETÁ", { lat: 1.61, lng: -75.61 }],
  ["CASANARE", { lat: 5.34, lng: -72.39 }],
  ["CAUCA", { lat: 2.44, lng: -76.61 }],
  ["CESAR", { lat: 10.47, lng: -73.25 }],
  ["CHOCÓ", { lat: 5.69, lng: -76.66 }],
  ["CÓRDOBA", { lat: 8.75, lng: -75.88 }],
  ["CUNDINAMARCA", { lat: 4.98, lng: -74.03 }],
  ["GUAINÍA", { lat: 3.86, lng: -67.92 }],
  ["GUAVIARE", { lat: 2.57, lng: -72.64 }],
  ["HUILA", { lat: 2.93, lng: -75.28 }],
  ["LA GUAJIRA", { lat: 11.54, lng: -72.91 }],
  ["MAGDALENA", { lat: 11.24, lng: -74.2 }],
  ["META", { lat: 4.15, lng: -73.64 }],
  ["NARIÑO", { lat: 1.21, lng: -77.28 }],
  ["NORTE DE SANTANDER", { lat: 7.89, lng: -72.5 }],
  ["PUTUMAYO", { lat: 1.15, lng: -76.65 }],
  ["QUINDÍO", { lat: 4.54, lng: -75.67 }],
  ["RISARALDA", { lat: 4.81, lng: -75.69 }],
  ["SAN ANDRÉS Y PROVIDENCIA", { lat: 12.58, lng: -81.7 }],
  ["SANTANDER", { lat: 7.13, lng: -73.13 }],
  ["SUCRE", { lat: 9.3, lng: -75.4 }],
  ["TOLIMA", { lat: 4.43, lng: -75.23 }],
  ["VALLE DEL CAUCA", { lat: 3.45, lng: -76.52 }],
  ["VAUPÉS", { lat: 1.25, lng: -70.23 }],
  ["VICHADA", { lat: 4.42, lng: -69.28 }],
]);

export default useLocation;
