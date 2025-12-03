// src/components/VectorMap.tsx

import { useState, useEffect, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css"; // Asegúrate de que este CSS exista o la librería esté configurada

// TopoJSON Optimizado de México
const GEO_URL = "https://gist.githubusercontent.com/diegovalle/5129746/raw/mx_tj.json";

interface Location {
  id: string;
  name: string;
  role: string;
  coordinates: [number, number];
}

const locations: Location[] = [
  {
    id: "tuxtla",
    name: "Corporativo Central",
    role: "Matriz Operativa",
    coordinates: [-93.113, 16.753],
  },
  {
    id: "tapachula",
    name: "CEDIS Tapachula",
    role: "Centro de Distribución",
    coordinates: [-92.261, 14.905],
  },
];

const VectorMap = () => {
  // Inicialización segura para SSR/Hydration
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [-93.5, 17.0], // Centro ligeramente ajustado para incluir Tuxtla sin recorte
    zoom: 1.5
  });

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth < 768) {
      setPosition({ coordinates: [-92.5, 15.8], zoom: 3.5 });
    }
  }, []);

  const handleZoomIn = () => {
    if (position.zoom >= 10) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.3 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.3 }));
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  const handleReset = () => {
    if (window.innerWidth < 768) {
      setPosition({ coordinates: [-92.5, 15.8], zoom: 3.5 });
    } else {
      setPosition({ coordinates: [-93.5, 17.0], zoom: 1.5 });
    }
  };

  if (!mounted) return <div className="w-full h-[500px] bg-slate-100 dark:bg-[#0B1120] rounded-[2.5rem] animate-pulse" />;

  return (
    <div className="relative w-full h-[600px] min-h-[500px] rounded-[2.5rem] overflow-hidden bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 shadow-2xl group transition-colors duration-500">

      {/* Capa de Textura / Grid Técnico */}
      <div
        className="absolute inset-0 opacity-[0.3] dark:opacity-[0.1] pointer-events-none z-0"
        style={{
          backgroundImage: "radial-gradient(#64748b 1px, transparent 1px)",
          backgroundSize: "30px 30px"
        }}
      ></div>

      {/* Leyenda Superior */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none select-none">
        <div className="flex items-center gap-3 bg-white/90 dark:bg-[#1a2333]/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-[#1a2333]"></span>
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-700 dark:text-slate-200 uppercase">
            Red 5G Chiapas
          </span>
        </div>
      </div>

      {/* Controles de Zoom */}
      <div className="absolute bottom-8 right-6 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-[#1a2333]/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all"
          aria-label="Zoom In"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-11 h-11 flex items-center justify-center bg-white/90 dark:bg-[#1a2333]/90 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all"
          aria-label="Zoom Out"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>
        </button>
        <button
          onClick={handleReset}
          className="w-11 h-11 flex items-center justify-center bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 border border-transparent text-white hover:bg-blue-500 active:scale-95 transition-all mt-2"
          aria-label="Reset Map"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Componente Mapa */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1800,
        }}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none relative z-10"
        height={600} // Height explícito para evitar recorte vertical
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={handleMoveEnd}
          maxZoom={12}
          minZoom={1}
        >
          {/* GEOGRAFÍA */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo: any) => {
                const stateName = geo.properties?.state_name || geo.properties?.name || "";
                const isChiapas = stateName.toLowerCase().includes("chiapas");

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: isChiapas ? "url(#activeStateGrad)" : "var(--map-fill-default)",
                        stroke: isChiapas ? "rgba(255,255,255,0.8)" : "var(--map-stroke)",
                        strokeWidth: isChiapas ? 1.5 : 0.5,
                        outline: "none",
                        filter: isChiapas ? "drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))" : "none",
                        transition: "all 0.3s ease"
                      },
                      hover: {
                        fill: isChiapas ? "#2563eb" : "var(--map-fill-hover)",
                        stroke: "#fff",
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: "default", // Cursor default para el mapa base
                      },
                      pressed: {
                        fill: isChiapas ? "#1e40af" : "var(--map-fill-pressed)",
                        outline: "none"
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* MARCADORES (Sobre la capa geográfica) */}
          {locations.map(({ id, name, role, coordinates }) => (
            <Marker key={id} coordinates={coordinates}>
              <g
                className="group cursor-pointer focus:outline-none"
                data-tooltip-id="map-tooltip"
                // HTML STRING SIMPLIFICADO PARA STYLING EN EL CSS
                data-tooltip-html={`
                  <div class="tooltip-content">
                    <div class="tooltip-header">
                       <div class="status-dot"></div>
                       <span>Sucursal Activa</span>
                    </div>
                    <p class="tooltip-title">${name}</p>
                    <p class="tooltip- role">${role}</p>
                  </div>
                `}
              >
                {/* Área interactiva invisible más grande para facilitar el hover */}
                <circle r={20} fill="transparent" />

                {/* Animación Radar */}
                <circle r={8} className="fill-blue-500 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75 pointer-events-none" />
                <circle r={5} className="fill-blue-600 dark:fill-blue-400 stroke-[1.5px] stroke-white dark:stroke-[#0B1120] transition-transform duration-300 group-hover:scale-125 pointer-events-none" />
              </g>
            </Marker>
          ))}
        </ZoomableGroup>

        <defs>
          <linearGradient id="activeStateGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" /> {/* Blue 900 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue 500 */}
          </linearGradient>
        </defs>
      </ComposableMap>

      {/* TOOLTIP REFACTORIZADO (Renderizado via Portal por defecto) */}
      <Tooltip
        id="map-tooltip"
        place="top"
        opacity={1}
        // Offset aumentado para no tapar el pin
        offset={20}
        // className limpia estilos default feos
        className="!opacity-100 !p-0 !bg-transparent !border-0 !shadow-none !z-[9999]"
        noArrow={false} // Usaremos arrow CSS personalizada
      />

      {/* INYECCIÓN DE ESTILOS (Para forzar el diseño Premium) */}
      <style>{`
        :root {
          --map-fill-default: #cbd5e1; 
          --map-fill-hover: #94a3b8;
          --map-fill-pressed: #64748b;
          --map-stroke: #ffffff;
        }
        .dark {
          --map-fill-default: #1e293b;
          --map-fill-hover: #334155;
          --map-fill-pressed: #0f172a;
          --map-stroke: #0f172a;
        }

        /* ESTILO DEL TOOLTIP GLASS */
        #map-tooltip {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(203, 213, 225, 0.5) !important; /* Slate 300 */
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2) !important;
          color: #0f172a !important;
          border-radius: 16px !important;
          padding: 0 !important;
          font-family: inherit !important;
        }

        .dark #map-tooltip {
          background: rgba(15, 23, 42, 0.90) !important; /* Navy oscuro */
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.6) !important;
          color: white !important;
        }

        /* FLECHA DEL TOOLTIP */
        .react-tooltip-arrow {
          background: rgba(255, 255, 255, 0.95) !important;
        }
        .dark .react-tooltip-arrow {
          background: rgba(15, 23, 42, 0.90) !important;
        }

        /* CONTENIDO INTERNO HTML DEL TOOLTIP */
        .tooltip-content {
          padding: 12px 16px;
          text-align: center;
          min-width: 160px;
        }
        .tooltip-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b; /* Slate 500 */
          margin-bottom: 6px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .dark .tooltip-header {
          color: #94a3b8; /* Slate 400 */
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #22c55e; /* Green 500 */
          box-shadow: 0 0 8px #22c55e;
        }
        .tooltip-title {
          font-weight: 700;
          font-size: 14px;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        .tooltip-role {
          font-size: 11px;
          color: #3b82f6; /* Blue 500 */
          font-weight: 600;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
};

export default VectorMap;