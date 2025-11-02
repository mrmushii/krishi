import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icon for vehicles
const vehicleIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to auto-center map when transports change
function MapUpdater({ transports, center }) {
  const map = useMap()
  
  useEffect(() => {
    if (transports.length > 0) {
      const bounds = transports
        .filter(t => t.currentLocation?.lat && t.currentLocation?.lng)
        .map(t => [t.currentLocation.lat, t.currentLocation.lng])
      
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    } else if (center) {
      map.setView([center.lat, center.lng], 13)
    }
  }, [transports, center, map])
  
  return null
}

export default function TransportMap({ 
  transports = [], 
  center = { lat: 23.8103, lng: 90.4125 }, // Default: Dhaka, Bangladesh
  height = '500px',
  showControls = true
}) {
  const [selectedTransport, setSelectedTransport] = useState(null)

  if (!transports || transports.length === 0) {
    return (
      <div className="w-full" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </MapContainer>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-300" style={{ height }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater transports={transports} center={center} />
        
        {transports.map(transport => {
          if (!transport.currentLocation?.lat || !transport.currentLocation?.lng) return null
          
          return (
            <Marker
              key={transport.id}
              position={[transport.currentLocation.lat, transport.currentLocation.lng]}
              icon={vehicleIcon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-sm mb-1">{transport.goodsType || 'Transport'}</h3>
                  {transport.assignedDriverName && (
                    <p className="text-xs text-gray-600">Driver: {transport.assignedDriverName}</p>
                  )}
                  {transport.assignedDriverId && (
                    <p className="text-xs text-gray-600">Vehicle: {transport.vehicleNumber || 'N/A'}</p>
                  )}
                  <p className="text-xs text-gray-600">Status: <span className="font-medium">{transport.status}</span></p>
                  {transport.destination && (
                    <p className="text-xs text-gray-600">To: {transport.destination}</p>
                  )}
                  {transport.currentLocation.timestamp && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated: {new Date(transport.currentLocation.timestamp.toDate()).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

