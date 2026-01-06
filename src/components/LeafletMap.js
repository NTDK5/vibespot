import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

/**
 * Advanced Leaflet Map Component
 * Features:
 * - Modern UI with custom styling
 * - Drag markers
 * - Click to place markers
 * - Smooth animations
 * - Multiple tile layers
 * - Custom controls
 */
export const LeafletMap = ({
  latitude = 9.0080,
  longitude = 38.7886,
  onLocationChange,
  onMarkerPress,
  markers = [],
  height = 400,
  interactive = true,
  showUserLocation = false,
  userLocation = null,
  markerImage = null, // Logo image URI or require()
  style,
}) => {
  const webViewRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [markerImageBase64, setMarkerImageBase64] = useState(null);

  // Load marker image and convert to base64 for WebView
  useEffect(() => {
    const loadMarkerImage = async () => {
      if (markerImage) {
        try {
          // Handle require() asset
          if (typeof markerImage === 'number') {
            const asset = Asset.fromModule(markerImage);
            await asset.downloadAsync();
            const uri = asset.localUri || asset.uri;
            
            if (uri) {
              // Convert to base64 for WebView compatibility
              try {
                const response = await fetch(uri);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                  setMarkerImageBase64(reader.result);
                };
                reader.onerror = () => {
                  // Fallback to URI if base64 conversion fails
                  setMarkerImageBase64(uri);
                };
                reader.readAsDataURL(blob);
              } catch (e) {
                // Fallback to URI
                setMarkerImageBase64(uri);
              }
            }
          } else if (markerImage.startsWith('data:') || markerImage.startsWith('http')) {
            // Already a data URI or URL
            setMarkerImageBase64(markerImage);
          } else {
            // Assume it's a local URI
            setMarkerImageBase64(markerImage);
          }
        } catch (error) {
          console.error('Error loading marker image:', error);
        }
      }
    };
    loadMarkerImage();
  }, [markerImage]);

  useEffect(() => {
    if (mapReady && webViewRef.current) {
      // Update markers when they change
      updateMarkers();
    }
  }, [markers, mapReady, markerImageBase64]);

  useEffect(() => {
    if (mapReady && webViewRef.current && onLocationChange) {
      // Center map on initial location
      centerMap(latitude, longitude);
    }
  }, [latitude, longitude, mapReady]);

  const centerMap = (lat, lng) => {
    const script = `
      if (window.map && window.currentMarker) {
        window.map.setView([${lat}, ${lng}], 15);
        window.currentMarker.setLatLng([${lat}, ${lng}]);
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const updateMarkers = () => {
    if (!webViewRef.current || !mapReady) return;

    const markersScript = markers.map((marker, index) => {
      const lat = marker.latitude || marker.lat;
      const lng = marker.longitude || marker.lng;
      const color = marker.color || '#667eea';
      const id = marker.id || index;
      const imageUrl = markerImageBase64 || '';
      return `window.addMarker(${lat}, ${lng}, ${index}, '${color}', '${id}', ${imageUrl ? `'${imageUrl}'` : 'null'});`;
    }).join('');

    const script = `
      if (window.map && window.clearMarkers) {
        window.clearMarkers();
        ${markersScript}
        window.setMarkerImage(${markerImageBase64 ? `'${markerImageBase64}'` : 'null'});
      }
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapReady') {
        setMapReady(true);
      }
      
      if (data.type === 'locationChange' && onLocationChange) {
        onLocationChange({
          latitude: data.lat,
          longitude: data.lng,
        });
      }
      
      if (data.type === 'markerDragEnd' && onLocationChange) {
        onLocationChange({
          latitude: data.lat,
          longitude: data.lng,
        });
      }
      
      if (data.type === 'markerClick' && onMarkerPress) {
        onMarkerPress({
          id: data.markerId,
          latitude: data.lat,
          longitude: data.lng,
        });
      }
    } catch (error) {
      console.error('Error parsing map message:', error);
    }
  };

  const leafletHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Leaflet Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  ${markerImageBase64 ? `<style>
    /* Preload marker image */
    #marker-image-preload {
      display: none;
    }
  </style>` : ''}
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }
    
    #map {
      width: 100%;
      height: 100%;
      background: #1a1a1a;
    }
    
    /* Custom Leaflet Styles */
    .leaflet-container {
      background: #1a1a1a !important;
    }
    
    .leaflet-control-zoom {
      border: none !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      border-radius: 12px !important;
      overflow: hidden;
    }
    
    .leaflet-control-zoom a {
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(10px);
      color: #333 !important;
      width: 44px !important;
      height: 44px !important;
      line-height: 44px !important;
      font-size: 20px !important;
      font-weight: 600 !important;
      border: none !important;
      transition: all 0.2s ease !important;
    }
    
    .leaflet-control-zoom a:hover {
      background: #fff !important;
      transform: scale(1.05);
    }
    
    .leaflet-control-zoom-in {
      border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
    }
    
    /* Custom Marker Styles */
    .custom-marker {
      background: #fff;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 3px solid #fff;
      transition: all 0.3s ease;
    }
    
    .custom-marker:hover {
      transform: scale(1.2);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
    
    .custom-marker-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .main-marker {
      width: 48px;
      height: 48px;
      background: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      border: 4px solid #fff;
      animation: pulse 2s infinite;
    }
    
    .main-marker-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }
    
    /* Custom Popup */
    .leaflet-popup-content-wrapper {
      border-radius: 12px !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
      padding: 0 !important;
    }
    
    .leaflet-popup-content {
      margin: 0 !important;
      padding: 12px 16px !important;
      font-size: 14px !important;
    }
    
    .leaflet-popup-tip {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
    }
    
    /* User Location Marker */
    .user-location-marker {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #007AFF;
      border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0, 122, 255, 0.5);
    }
    
    /* Loading Indicator */
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="loading" id="loading">Loading map...</div>
  ${markerImageBase64 ? `<img id="marker-image-preload" src="${markerImageBase64}" crossOrigin="anonymous" />` : ''}
  
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // Initialize map
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
      ${!interactive ? 'dragging: false, touchZoom: false, doubleClickZoom: false, scrollWheelZoom: false, boxZoom: false, keyboard: false' : ''}
    }).setView([${latitude}, ${longitude}], 15);
    
    window.map = map;
    
    // Modern tile layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{s}/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });
    
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    });
    
    const modernLayer = L.tileLayer('https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token={accessToken}', {
      attribution: '© Jawg Maps © OpenStreetMap',
      maxZoom: 19,
      accessToken: 'YOUR_JAWG_TOKEN'
    });
    
    // Use modern dark theme by default
    darkLayer.addTo(map);
    
    // Store markers
    let markers = [];
    let currentMarker = null;
    let userLocationMarker = null;
    
    // Store marker image
    let markerImageUrl = null;
    
    // Create custom icon with logo image
    function createCustomIcon(color = '#667eea', size = 48, imageUrl = null) {
      if (imageUrl) {
        // Use logo image - handle data URIs and file:// URIs
        let iconUrl = imageUrl;
        
        // For file:// URIs, try to convert using canvas (in browser context)
        if (imageUrl.startsWith('file://')) {
          // Try to load from preloaded image or use data URI conversion
          const preloadImg = document.getElementById('marker-image-preload');
          if (preloadImg && preloadImg.complete) {
            // Convert to data URI using canvas
            try {
              const canvas = document.createElement('canvas');
              canvas.width = preloadImg.naturalWidth || size;
              canvas.height = preloadImg.naturalHeight || size;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(preloadImg, 0, 0);
              iconUrl = canvas.toDataURL('image/png');
            } catch (e) {
              // Fallback to original
              console.warn('Could not convert image to data URI:', e);
            }
          }
        }
        
        return L.icon({
          iconUrl: iconUrl,
          iconSize: [size, size],
          iconAnchor: [size / 2, size],
          popupAnchor: [0, -size],
          shadowUrl: null,
          crossOrigin: true,
        });
      }
      // Fallback to div icon
      return L.divIcon({
        className: 'custom-marker',
        html: '<div class="custom-marker-icon" style="background: ' + color + '"></div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }
    
    window.setMarkerImage = function(imageUrl) {
      markerImageUrl = imageUrl;
    };
    
    function createMainMarker() {
      return L.divIcon({
        className: 'main-marker',
        html: '<div class="main-marker-icon"></div>',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
    }
    
    // Add main marker
    currentMarker = L.marker([${latitude}, ${longitude}], {
      draggable: ${interactive},
      icon: createMainMarker(),
    }).addTo(map);
    
    if (${interactive}) {
      currentMarker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerDragEnd',
          lat: pos.lat,
          lng: pos.lng
        }));
      });
    }
    
    // Click to place marker
    if (${interactive}) {
      map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        currentMarker.setLatLng([lat, lng]);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'locationChange',
          lat: lat,
          lng: lng
        }));
      });
    }
    
    // Helper functions
    window.addMarker = function(lat, lng, index, color, markerId, imageUrl) {
      // Use provided imageUrl or fallback to global markerImageUrl or default
      const iconUrl = imageUrl || markerImageUrl;
      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(color || '#667eea', 48, iconUrl),
      }).addTo(map);
      
      marker.on('click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'markerClick',
          lat: lat,
          lng: lng,
          markerId: markerId || index
        }));
      });
      
      markers.push(marker);
      return marker;
    };
    
    window.clearMarkers = function() {
      markers.forEach(m => map.removeLayer(m));
      markers = [];
    };
    
    window.setMainMarker = function(lat, lng) {
      if (currentMarker) {
        currentMarker.setLatLng([lat, lng]);
      }
    };
    
    window.setUserLocation = function(lat, lng) {
      if (userLocationMarker) {
        userLocationMarker.setLatLng([lat, lng]);
      } else {
        userLocationMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'user-location-marker',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
          zIndexOffset: 1000
        }).addTo(map);
      }
    };
    
    // Add user location if provided
    ${userLocation && showUserLocation ? `window.setUserLocation(${userLocation.latitude}, ${userLocation.longitude});` : ''}
    
    // Add initial markers
    ${markers.map((marker, index) => {
      const lat = marker.latitude || marker.lat;
      const lng = marker.longitude || marker.lng;
      return `window.addMarker(${lat}, ${lng}, ${index});`;
    }).join('')}
    
    // Map ready
    map.whenReady(function() {
      document.getElementById('loading').style.display = 'none';
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapReady'
      }));
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, { height }, style]}>
      {!mapReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: leafletHTML }}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    zIndex: 1000,
  },
});
