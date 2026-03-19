import type { CoachStep } from '@/components/guide';

export const DISCOVER_STEPS: CoachStep[] = [
  { targetKey: 'discover.viewfinder', body: 'guide.discover.step1', icon: '✿', position: 'below' },
  { targetKey: 'discover.gpsIndicator', body: 'guide.discover.step2', icon: '📍', position: 'above' },
  { targetKey: 'discover.quotaDisplay', body: 'guide.discover.step3', icon: '🌿', position: 'above' },
];

export const STAMP_STEPS: CoachStep[] = [
  { targetKey: 'stamp.preview', body: 'guide.stamp.step1', icon: '🎨', position: 'above' },
  { targetKey: 'stamp.positionGrid', body: 'guide.stamp.step2', icon: '⊞', position: 'below' },
  { targetKey: 'stamp.opacitySlider', body: 'guide.stamp.step3', icon: '✨', position: 'above' },
  { targetKey: 'stamp.saveButton', body: 'guide.stamp.step4', icon: '💾', position: 'above' },
];

export const HERBARIUM_STEPS: CoachStep[] = [
  { targetKey: 'herbarium.collection', body: 'guide.herbarium.step1', icon: '🌸', position: 'below' },
  { targetKey: 'herbarium.filterBar', body: 'guide.herbarium.step2', icon: '⭐', position: 'below' },
];

export const MAP_STEPS: CoachStep[] = [
  { targetKey: 'map.layerToggle', body: 'guide.map.step1', icon: '🗺', position: 'below' },
  { targetKey: 'map.heatmapToggle', body: 'guide.map.step2', icon: '🔥', position: 'below' },
];
