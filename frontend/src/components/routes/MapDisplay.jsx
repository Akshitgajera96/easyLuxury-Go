// src/components/routes/MapDisplay.jsx
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-hot-toast";
import LoadingSpinner from "../common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Route as RouteIcon, 
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize
} from "lucide-react";

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const createCustomIcon = (iconElement, color = '#007BFF') => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
      ">
        ${iconElement}
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper function to estimate travel time
const estimateTravelTime = (distance, averageSpeed = 60) => {
  const hours = distance / averageSpeed;
  const totalMinutes = Math.round(hours * 60);
  const hoursPart = Math.floor(totalMinutes / 60);
  const minutesPart = totalMinutes % 60;
  
  if (hoursPart > 0) {
    return `${hoursPart}h ${minutesPart}m`;
  }
  return `${minutesPart}m`;
};

const MapDisplay = ({ 
  pickup, 
  destination, 
  stops = [], 
  routes = [],
  onRouteSelect,
  showControls = true,
  height = "500px"
}) => {
  const mapRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    initMap();
    return () => cleanupMap();
  }, []);

  useEffect(() => {
    if (pickup && destination) {
      drawRoute();
    } else if (mapRef.current) {
      clearRoute();
    }
  }, [pickup, destination, stops, routes]);

  const initMap = () => {
    if (mapRef.current) return;

    const defaultCenter = [20.5937, 78.9629]; // Center of India
    const defaultZoom = 5;

    mapRef.current = L.map('map', {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
      attributionControl: true
    });

    // Add base tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    // Add zoom control
    L.control.zoom({
      position: 'bottomright'
    }).addTo(mapRef.current);

    // Add custom controls
    addCustomControls();
  };

  const addCustomControls = () => {
    if (!mapRef.current) return;

    // Custom zoom buttons
    const zoomControl = L.control({ position: 'topright' });
    zoomControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      
      // Create icons using SVG elements
      const zoomInIcon = document.createElement('div');
      zoomInIcon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>';
      
      const zoomOutIcon = document.createElement('div');
      zoomOutIcon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path></svg>';
      
      const fitBoundsIcon = document.createElement('div');
      fitBoundsIcon.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path></svg>';
      
      div.innerHTML = `
        <a href="#" title="Zoom In" class="zoom-in p-2 bg-white hover:bg-gray-100 block border-b">${zoomInIcon.innerHTML}</a>
        <a href="#" title="Zoom Out" class="zoom-out p-2 bg-white hover:bg-gray-100 block border-b">${zoomOutIcon.innerHTML}</a>
        <a href="#" title="Fit Bounds" class="fit-bounds p-2 bg-white hover:bg-gray-100 block">${fitBoundsIcon.innerHTML}</a>
      `;
      
      L.DomEvent.on(div.querySelector('.zoom-in'), 'click', (e) => {
        L.DomEvent.stopPropagation(e);
        mapRef.current.zoomIn();
      });
      
      L.DomEvent.on(div.querySelector('.zoom-out'), 'click', (e) => {
        L.DomEvent.stopPropagation(e);
        mapRef.current.zoomOut();
      });
      
      L.DomEvent.on(div.querySelector('.fit-bounds'), 'click', (e) => {
        L.DomEvent.stopPropagation(e);
        if (routeLayerRef.current) {
          mapRef.current.fitBounds(routeLayerRef.current.getBounds());
        } else if (pickup && destination) {
          const bounds = L.latLngBounds(
            [pickup.lat, pickup.lng],
            [destination.lat, destination.lng]
          );
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      });

      return div;
    };
    zoomControl.addTo(mapRef.current);
  };

  const drawRoute = async () => {
    if (!mapRef.current || !pickup || !destination) return;

    setLoading(true);
    clearRoute();

    try {
      // In a real app, you would call your API here
      // For now, we'll use a fallback approach
      drawFallbackRoute();
    } catch (error) {
      console.error("Failed to draw route:", error);
      toast.error("Could not calculate route. Please try again.");
      
      // Fallback: Draw straight line and show basic markers
      drawFallbackRoute();
    } finally {
      setLoading(false);
    }
  };

  const drawFallbackRoute = () => {
    const coordinates = [
      [pickup.lat, pickup.lng],
      ...stops.map(stop => [stop.lat, stop.lng]),
      [destination.lat, destination.lng]
    ];

    routeLayerRef.current = L.polyline(coordinates, {
      color: '#007BFF',
      weight: 5,
      opacity: 0.7,
      dashArray: '5, 10',
      lineJoin: 'round'
    }).addTo(mapRef.current);

    addMarkers();
    
    // Fit bounds
    const bounds = routeLayerRef.current.getBounds();
    mapRef.current.fitBounds(bounds, { padding: [50, 50] });

    // Estimate distance and duration
    const distance = calculateStraightLineDistance(coordinates);
    const duration = estimateTravelTime(distance);
    
    setRouteInfo({
      distance,
      duration,
      coordinates,
      isFallback: true
    });
  };

  const calculateStraightLineDistance = (coordinates) => {
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lat1, lng1] = coordinates[i];
      const [lat2, lng2] = coordinates[i + 1];
      totalDistance += calculateDistance(lat1, lng1, lat2, lng2);
    }
    return totalDistance;
  };

  const addMarkers = () => {
    clearMarkers();

    const allPoints = [pickup, ...stops, destination];

    markersRef.current = allPoints.map((point, index) => {
      let marker;
      
      if (index === 0) {
        // Pickup marker
        marker = L.marker([point.lat, point.lng], {
          icon: createCustomIcon('<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>', '#10B981')
        }).addTo(mapRef.current);
        marker.bindPopup(`
          <div class="p-2">
            <strong>🚗 Pickup Location</strong>
            <p class="text-sm">${point.name || 'Starting point'}</p>
          </div>
        `);
      } else if (index === allPoints.length - 1) {
        // Destination marker
        marker = L.marker([point.lat, point.lng], {
          icon: createCustomIcon('<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>', '#EF4444')
        }).addTo(mapRef.current);
        marker.bindPopup(`
          <div class="p-2">
            <strong>🏁 Destination</strong>
            <p class="text-sm">${point.name || 'Destination'}</p>
          </div>
        `);
      } else {
        // Stop marker
        marker = L.marker([point.lat, point.lng], {
          icon: createCustomIcon(`${index}`, '#6366F1')
        }).addTo(mapRef.current);
        marker.bindPopup(`
          <div class="p-2">
            <strong>🛑 Stop ${index}</strong>
            <p class="text-sm">${point.name || `Stop ${index}`}</p>
          </div>
        `);
      }

      return marker;
    });
  };

  const clearRoute = () => {
    if (routeLayerRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    clearMarkers();
    setRouteInfo(null);
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = [];
  };

  const cleanupMap = () => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  };

  const handleRefresh = () => {
    if (pickup && destination) {
      drawRoute();
    }
  };

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-lg relative">
      {/* Map Container */}
      <div 
        id="map" 
        className="w-full"
        style={{ height }}
      />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1000">
          <LoadingSpinner message="Calculating route..." variant="light" />
        </div>
      )}

      {/* Route Information Card */}
      {routeInfo && (
        <div className="absolute top-4 left-4 z-1000 max-w-sm">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm">
                <RouteIcon className="w-4 h-4 mr-2" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">{(routeInfo.distance).toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Time:</span>
                  <span className="font-medium">{routeInfo.duration}</span>
                </div>
                {routeInfo.isFallback && (
                  <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                    ⚠️ Showing straight-line distance. Actual route may vary.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refresh Button */}
      {showControls && pickup && destination && (
        <div className="absolute top-4 right-16 z-1000">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Route
          </Button>
        </div>
      )}
    </div>
  );
};

export default MapDisplay;