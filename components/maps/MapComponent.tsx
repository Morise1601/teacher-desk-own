'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  onLocationSelect: (address: string) => void;
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setAddress: (addr: string) => void;
}

export default function MapComponent({ 
  onLocationSelect, 
  position, 
  setPosition, 
  loading, 
  setLoading,
  setAddress
}: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    // Fix default icon issue
    const DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    L.Marker.prototype.options.icon = DefaultIcon;
  }, []);

  const reverseGeocode = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
        onLocationSelect(data.display_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    } finally {
      setLoading(false);
    }
  };

  function LocationMarker() {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
      },
    });

    return position === null ? null : (
      <Marker position={position}></Marker>
    );
  }

  function RecenterMap({ pos }: { pos: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      if (map && pos) {
        map.flyTo(pos, 16, {
          animate: true,
          duration: 1.5
        });
      }
    }, [pos, map]);
    return null;
  }

  if (!isMounted || !position) return null;

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-100">
      <MapContainer 
        key={`map-${position[0]}-${position[1]}`} // Use key to force fresh mount if core pos shifts drastically or fails
        center={position} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }} 
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <LocationMarker />
        <RecenterMap pos={position} />
      </MapContainer>
    </div>
  );
}
