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
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:5001/api/cauldrons")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Cauldrons data:", data);

        // Compute min/max for lat/lon dynamically
        const latitudes = data.map((c: Cauldron) => c.latitude);
        const longitudes = data.map((c: Cauldron) => c.longitude);
        const latMin = Math.min(...latitudes);
        const latMax = Math.max(...latitudes);
        const lonMin = Math.min(...longitudes);
        const lonMax = Math.max(...longitudes);

        // Convert each cauldron's lat/lon → pixel coordinates
        const converted = data.map((c: Cauldron) => {
          const x = ((c.longitude - lonMin) / (lonMax - lonMin)) * imgWidth;
          const y = ((latMax - c.latitude) / (latMax - latMin)) * imgHeight;
          return { ...c, position: [y, x] as [number, number] };
        });

        setCauldrons(converted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching cauldrons:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading cauldrons...</div>;
  if (error) return <div>Error: {error}</div>;
  if (cauldrons.length === 0) return <div>No cauldrons found.</div>;

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <MapContainer
        crs={L.CRS.Simple}
        bounds={bounds}
        zoom={0}
        minZoom={-2}
        maxZoom={4}
        style={{ 
          height: "100%", 
          width: "100%", 
          background: "linear-gradient(45deg, #34732A 0%, #8EAB6E 50%, #E8E3B1 100%)"
        }}
      >
        {cauldrons.map((c) => (
          <Marker key={c.id} position={c.position}>
            <Popup>
              <b>{c.name}</b>
              <br />
              ID: {c.id}
              <br />
              Max Volume: {c.max_volume}
              <br />
              Pixel Position: {c.position[0].toFixed(1)}, {c.position[1].toFixed(1)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}