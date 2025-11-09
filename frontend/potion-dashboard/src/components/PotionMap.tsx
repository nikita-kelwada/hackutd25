import { useEffect, useState } from "react";
import { MapContainer, ImageOverlay, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Define cauldron type
interface Cauldron {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  max_volume: number;
  position?: [number, number];
}

// Define market type
interface Market {
  name: string;
  latitude: number;
  longitude: number;
  position?: [number, number];
}

const customIcon = new L.Icon({
  iconUrl: '/potion.png', // Put your PNG in the public folder
  iconSize: [32, 32], // Size of the icon in pixels [width, height]
  iconAnchor: [16, 32], // Point of the icon which will correspond to marker's location [horizontal, vertical]
  popupAnchor: [0, -32] // Point from which the popup should open relative to the iconAnchor
});

// Custom icon for the market
const marketIcon = new L.Icon({
  iconUrl: '/market.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// Your image size in pixels (must match your actual fantasy-map.jpg)
const imgWidth = 800;
const imgHeight = 500;

// Bounds for the fantasy map (pixel coordinates)
const bounds: L.LatLngBoundsExpression = [
  [0, 0], // top-left
  [imgHeight, imgWidth] // bottom-right
];

export default function PotionMap() {
  const [cauldrons, setCauldrons] = useState<Cauldron[]>([]);
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch both cauldrons and market data through local backend
    Promise.all([
      fetch("http://127.0.0.1:5001/api/cauldrons"),
      fetch("http://127.0.0.1:5001/api/market")
    ])
      .then(([cauldronRes, marketRes]) => {
        if (!cauldronRes.ok) throw new Error(`Cauldrons HTTP error! status: ${cauldronRes.status}`);
        if (!marketRes.ok) throw new Error(`Market HTTP error! status: ${marketRes.status}`);
        return Promise.all([cauldronRes.json(), marketRes.json()]);
      })

      .then(([cauldronData, marketData]) => {
        console.log("Cauldrons data:", cauldronData);
        console.log("Market data:", marketData);

        // Combine all locations for coordinate calculation
        const allLocations = [
          ...cauldronData.map((c: Cauldron) => ({ lat: c.latitude, lon: c.longitude })),
          { lat: marketData.latitude, lon: marketData.longitude }
        ];

        const latitudes = allLocations.map(l => l.lat);
        const longitudes = allLocations.map(l => l.lon);
        const latMin = Math.min(...latitudes);
        const latMax = Math.max(...latitudes);
        const lonMin = Math.min(...longitudes);
        const lonMax = Math.max(...longitudes);

        // Convert cauldron coordinates
        const convertedCauldrons = cauldronData.map((c: Cauldron) => {
          const x = ((c.longitude - lonMin) / (lonMax - lonMin)) * imgWidth;
          const y = ((latMax - c.latitude) / (latMax - latMin)) * imgHeight;
          return { ...c, position: [y, x] as [number, number] };
        });

        // Convert market coordinates
        const marketX = ((marketData.longitude - lonMin) / (lonMax - lonMin)) * imgWidth;
        const marketY = ((latMax - marketData.latitude) / (latMax - latMin)) * imgHeight;
        const convertedMarket: Market = {
          name: marketData.name || "Enchanted Market",
          latitude: marketData.latitude,
          longitude: marketData.longitude,
          position: [marketY, marketX]
        };

        setCauldrons(convertedCauldrons);
        setMarket(convertedMarket);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading cauldrons and market...</div>;
  if (error) return <div>Error: {error}</div>;
  if (cauldrons.length === 0) return <div>No cauldrons found.</div>;

  return (
    <div style={{ 
      height: "600px", // Fixed height for better control
      width: "100%", // Takes full width of container
      maxWidth: "1400px", // Reasonable max width
      margin: "0 auto", // Center the map container
      position: "relative" // Ensures proper rendering
    }}>
      <MapContainer
        crs={L.CRS.Simple}
        bounds={bounds}
        zoom={0}
        minZoom={-2}
        maxZoom={4}
        style={{ 
          height: "100%", 
          width: "100%", 
          background: "linear-gradient(45deg, #34732A 0%, #8EAB6E 50%, #E8E3B1 100%)",
          borderRadius: "8px", // Optional: adds rounded corners
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" // Optional: adds subtle shadow
        }}
      >
        {cauldrons.map((c) => (
          <Marker 
            key={c.id} 
            position={c.position}
            icon={customIcon}>
            <Popup>
              <b>{c.name}</b>
              <br />
              ID: {c.id}
              <br />
              Max Volume: {c.max_volume}
              <br />
              Pixel Position: {c.position![0].toFixed(1)}, {c.position![1].toFixed(1)}
            </Popup>
          </Marker>
        ))}
        
        {/* Market marker with custom icon */}
        {market && (
          <Marker 
            key="enchanted-market" 
            position={market.position!}
            icon={marketIcon}
          >
            <Popup>
              <b>🏪 {market.name}</b>
              <br />
              Latitude: {market.latitude.toFixed(4)}
              <br />
              Longitude: {market.longitude.toFixed(4)}
              <br />
              Pixel Position: {market.position![0].toFixed(1)}, {market.position![1].toFixed(1)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}