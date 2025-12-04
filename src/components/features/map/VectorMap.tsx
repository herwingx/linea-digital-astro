// src/components/VectorMap.tsx

import { useState, useEffect, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// URL del TopoJSON de México
const GEO_URL = "https://gist.githubusercontent.com/diegovalle/5129746/raw/mx_tj.json";

// Datos enriquecidos para el Tooltip
interface Location {
  id: string;
  name: string;
  role: string;
  address: string;
  schedule: string;
  coordinates: [number, number];
}

const locations: Location[] = [
  {
    id: "tuxtla",
    name: "Corporativo Tuxtla",
    role: "Matriz Operativa",
    address: "1a Av. Norte Poniente #834, Centro",
    schedule: "Lun-Vie: 9am - 6pm",
    coordinates: [-93.113, 16.753],
  },
  {
    id: "tapachula",
    name: "Sucursal Tapachula",
    role: "Matriz Operativa",
    address: "4a. Av. Nte. 70, Los Naranjos",
    schedule: "Lun-Vie: 9am - 6pm",
    coordinates: [-92.261, 14.905],
  },
];

const VectorMap = () => {
  // Control de estado para evitar hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  
  // Estado de posición (Zoom y Centro)
  const [position, setPosition] = useState({ coordinates: [-93.5, 16.5] as [number, number], zoom: 3 });

  // Ajustar vista inicial según el dispositivo al montar
  useEffect(() => {
    setIsMounted(true);
    const width = window.innerWidth;
    
    if (width < 768) {
      // Móvil: Zoom fuerte sobre Chiapas
      setPosition({ coordinates: [-92.5, 14.2], zoom: 3.5 });
    } else if (width < 1024) {
      // Tablet
      setPosition({ coordinates: [-93.0, 16.5], zoom: 4 });
    } else {
      // Desktop: Vista sureste amplia
      setPosition({ coordinates: [-93.5, 16.8], zoom: 2.8 }); 
    }
  }, []);

  const handleZoomIn = () => {
    if (position.zoom >= 15) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.2 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.2 }));
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  // Botón de reset inteligente
  const handleReset = useCallback(() => {
    const width = window.innerWidth;
    const newPosition = width < 768 
      ? { coordinates: [-92.5, 14.2] as [number, number], zoom: 3.5 }
      : { coordinates: [-93.5, 16.8] as [number, number], zoom: 2.8 };
    
    setPosition(newPosition);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] md:h-[500px] bg-slate-100 dark:bg-[#151e2e] rounded-[2rem] animate-pulse flex items-center justify-center">
         <span className="text-slate-400 text-sm font-bold tracking-wider uppercase">Cargando Mapa...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[450px] md:h-[600px] rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 shadow-2xl group select-none touch-pan-y">
      
      {/* === 1. UI LAYERS === */}
      
      {/* Textura de Fondo */}
      <div 
        className="absolute inset-0 opacity-[0.3] dark:opacity-[0.15] pointer-events-none z-0" 
        style={{
          backgroundImage: "radial-gradient(#64748b 0.8px, transparent 0.8px)",
          backgroundSize: "20px 20px"
        }}
      />

      {/* Leyenda Flotante */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none hidden sm:block">
        <div className="flex items-center gap-3 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border-[1.5px] border-white dark:border-[#0B1120]"></span>
          </span>
          <span className="text-[10px] font-bold tracking-widest text-slate-600 dark:text-slate-300 uppercase">
            Territorio Activo
          </span>
        </div>
      </div>

      {/* Controles de Navegación (Adaptativos) */}
      <div className="absolute bottom-60 lg:bottom-24 right-6 z-50 flex flex-col gap-2" style={{ pointerEvents: 'auto', position: 'absolute', zIndex: 9999 }}>
        <div className="bg-white/90 dark:bg-[#151e2e]/90 backdrop-blur-lg rounded-2xl shadow-lg border border-slate-200 dark:border-white/10 p-1.5 flex flex-col gap-1" style={{ pointerEvents: 'auto' }}>
          <button
            type="button"
            onClick={handleZoomIn}
            onMouseDown={(e) => { e.stopPropagation(); }}
            className="w-10 h-10 md:w-11 md:h-11 min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center text-slate-600 dark:text-slate-300 bg-white dark:bg-[#151e2e] hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 rounded-xl transition-all cursor-pointer touch-none"
            aria-label="Acercar"
            style={{ pointerEvents: 'auto' }}
          >
            <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" /></svg>
          </button>
          
          <div className="h-px w-full bg-slate-200 dark:bg-white/5"></div>
          
          <button
            type="button"
            onClick={handleZoomOut}
            onMouseDown={(e) => { e.stopPropagation(); }}
            className="w-10 h-10 md:w-11 md:h-11 min-w-[2.5rem] min-h-[2.5rem] flex items-center justify-center text-slate-600 dark:text-slate-300 bg-white dark:bg-[#151e2e] hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 rounded-xl transition-all cursor-pointer touch-none"
            aria-label="Alejar"
            style={{ pointerEvents: 'auto' }}
          >
             <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
          </button>
        </div>
        
        <button
          type="button"
          onClick={handleReset}
          onMouseDown={(e) => { e.stopPropagation(); }}
          className="w-12 h-12 md:w-[52px] md:h-[52px] min-w-[3rem] min-h-[3rem] flex items-center justify-center text-slate-600 dark:text-slate-300 bg-white dark:bg-[#151e2e] hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 rounded-xl transition-all cursor-pointer touch-none"
          aria-label="Centrar Mapa"
          style={{ pointerEvents: 'auto' }}
        >
           <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
           </svg>
        </button>
      </div>

      {/* === 2. MAPA INTERACTIVO === */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1600,
        }}
        width={800}
        height={600}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none relative z-0"
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={handleMoveEnd}
          maxZoom={12}
          minZoom={1}
        >
          {/* A. CAPA GEOGRÁFICA */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo: any) => {
                const stateName = geo.properties?.state_name || "";
                const isChiapas = stateName.toLowerCase().includes("chiapas");

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: isChiapas ? "url(#activeStateGrad)" : "var(--fill-default)",
                        stroke: isChiapas ? "#ffffff" : "var(--stroke-default)",
                        strokeWidth: isChiapas ? 1.2 : 0.4,
                        outline: "none",
                        transition: "all 0.3s ease"
                      },
                      hover: {
                        fill: isChiapas ? "#3b82f6" : "var(--fill-hover)",
                        stroke: "#fff",
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: isChiapas ? "default" : "default"
                      },
                      pressed: { fill: isChiapas ? "#1e40af" : "var(--fill-default)", outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* B. MARCADORES (Solo se muestran si el zoom es suficiente o siempre, a decisión) */}
          {locations.map(({ id, name, role, address, schedule, coordinates }) => (
            <Marker key={id} coordinates={coordinates}>
               {/* Tooltip Trigger Group */}
               <g 
                 className="cursor-pointer focus:outline-none group/marker"
                 data-tooltip-id="map-tooltip"
                 data-tooltip-html={`
                    <div class="tooltip-container">
                        <div class="tooltip-header">
                           <span class="dot"></span>
                           <span class="text">Ubicación</span>
                        </div>
                        <p class="tooltip-title">${name}</p>
                        <p class="tooltip-role">${role}</p>
                        
                        <div class="tooltip-divider"></div>
                        
                        <div class="tooltip-row">
                            <span class="icon">📍</span>
                            <span>${address}</span>
                        </div>
                        <div class="tooltip-row">
                            <span class="icon">🕒</span>
                            <span>${schedule}</span>
                        </div>
                    </div>
                 `}
               >
                 {/* Efecto Radar */}
                 <circle r={8} className="fill-blue-500 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-60 pointer-events-none" />
                 
                 {/* Anillo Principal */}
                 <circle r={5} className="fill-blue-600 dark:fill-blue-400 stroke-[1.5px] stroke-white dark:stroke-[#0B1120] transition-all duration-300 group-hover/marker:scale-150" />
                 
                 {/* Etiqueta Permanente en Mobile o Hover en Desktop */}
                 <text 
                    textAnchor="middle" 
                    y={-10} 
                    className="text-[5px] font-bold fill-slate-700 dark:fill-white opacity-0 md:group-hover/marker:opacity-100 transition-opacity"
                 >
                     {name}
                 </text>
               </g>
            </Marker>
          ))}
        </ZoomableGroup>
        
        <defs>
           <linearGradient id="activeStateGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" /> {/* Dark Blue */}
              <stop offset="100%" stopColor="#3b82f6" /> {/* Blue 500 */}
           </linearGradient>
        </defs>
      </ComposableMap>

      {/* === 3. TOOLTIP PERSONALIZADO === */}
      <Tooltip
        id="map-tooltip"
        place="top"
        offset={20}
        opacity={1}
        className="!z-50 !p-0 !bg-transparent !border-0 !shadow-none !opacity-100"
        noArrow={false} // Flecha CSS controlada abajo
        float={true}    // Flota con el cursor, útil en web
      />

      {/* CSS INYECTADO PARA TOOLTIP */}
      <style>{`
        :root {
           --fill-default: #cbd5e1;
           --fill-hover: #94a3b8;
           --stroke-default: #ffffff;
        }
        .dark {
           --fill-default: #1e293b; /* Slate 800 */
           --fill-hover: #334155;
           --stroke-default: #0f172a;
        }

        /* WRAPPER DEL TOOLTIP */
        #map-tooltip {
           z-index: 1000 !important;
           /* Importante: Quitar padding/bg default de la librería */
           background: transparent !important;
           box-shadow: none !important;
        }
        
        /* FLECHA PERSONALIZADA */
        .react-tooltip-arrow {
            background: rgba(255, 255, 255, 0.98) !important;
        }
        .dark .react-tooltip-arrow {
            background: rgba(15, 23, 42, 0.95) !important;
        }

        /* ESTILOS INTERNOS (Glass Card) */
        .tooltip-container {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(203, 213, 225, 0.5);
            box-shadow: 0 15px 40px -5px rgba(0, 0, 0, 0.15);
            color: #0f172a;
            border-radius: 16px;
            padding: 16px;
            width: 220px;
            font-family: inherit;
        }

        .dark .tooltip-container {
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #ffffff;
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);
        }

        .tooltip-header {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 6px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .dark .tooltip-header { color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.08); }
        
        .tooltip-header .dot {
            width: 6px;
            height: 6px;
            background: #22c55e;
            border-radius: 50%;
            box-shadow: 0 0 6px #22c55e;
        }

        .tooltip-title {
            font-weight: 800;
            font-size: 15px;
            line-height: 1.1;
            margin-bottom: 2px;
            color: #0f172a;
        }
        .dark .tooltip-title { color: white; }

        .tooltip-role {
            font-size: 11px;
            color: #3b82f6;
            font-weight: 700;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        
        .tooltip-divider {
             height: 1px;
             background: transparent;
             margin: 6px 0;
        }

        .tooltip-row {
            display: flex;
            gap: 8px;
            font-size: 10px;
            color: #475569;
            line-height: 1.4;
            text-align: left;
        }
        .dark .tooltip-row { color: #cbd5e1; }
        .tooltip-row .icon { opacity: 0.8; font-size: 11px; }
      `}</style>

    </div>
  );
};

export default VectorMap;