// src/components/guide/GuideMeasureContext.tsx
import React, { createContext, useContext, useRef, useCallback } from 'react';
import { LayoutChangeEvent } from 'react-native';

type Rect = { x: number; y: number; width: number; height: number };

interface GuideMeasureContextValue {
  register: (key: string, event: LayoutChangeEvent) => void;
  getRect: (key: string) => Rect | null;
}

export const GuideMeasureContext = createContext<GuideMeasureContextValue>({
  register: () => {},
  getRect: () => null,
});

export function GuideMeasureProvider({ children }: { children: React.ReactNode }) {
  const rectsRef = useRef<Map<string, Rect>>(new Map());

  const register = useCallback((key: string, event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    rectsRef.current.set(key, { x, y, width, height });
  }, []);

  const getRect = useCallback((key: string): Rect | null => {
    return rectsRef.current.get(key) ?? null;
  }, []);

  return (
    <GuideMeasureContext.Provider value={{ register, getRect }}>
      {children}
    </GuideMeasureContext.Provider>
  );
}

export function useGuideMeasure(): GuideMeasureContextValue {
  return useContext(GuideMeasureContext);
}
