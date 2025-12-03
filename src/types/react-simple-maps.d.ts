declare module 'react-simple-maps' {
  import { ComponentType, CSSProperties } from 'react';

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    className?: string;
    style?: CSSProperties;
    children?: React.ReactNode;
  }

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void;
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    onMove?: (position: { coordinates: [number, number]; zoom: number }) => void;
    children?: React.ReactNode;
  }

  export interface GeographiesProps {
    geography: string | object;
    children: (data: { geographies: any[] }) => React.ReactNode;
  }

  export interface GeographyProps {
    geography: any;
    style?: {
      default?: CSSProperties & { [key: string]: any };
      hover?: CSSProperties & { [key: string]: any };
      pressed?: CSSProperties & { [key: string]: any };
    };
    [key: string]: any;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: React.ReactNode;
    [key: string]: any;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const Marker: ComponentType<MarkerProps>;
}
