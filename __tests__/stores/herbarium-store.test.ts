import { useHerbariumStore } from '../../src/stores/herbarium-store';

describe('HerbariumStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useHerbariumStore.setState({ tick: 0 });
  });

  it('has tick = 0 initially', () => {
    const state = useHerbariumStore.getState();
    expect(state.tick).toBe(0);
  });

  it('triggerRefresh increments tick by 1', () => {
    useHerbariumStore.getState().triggerRefresh();
    expect(useHerbariumStore.getState().tick).toBe(1);
  });

  it('multiple triggerRefresh calls increment sequentially', () => {
    const { triggerRefresh } = useHerbariumStore.getState();
    triggerRefresh();
    triggerRefresh();
    triggerRefresh();
    expect(useHerbariumStore.getState().tick).toBe(3);
  });

  it('state can be read via getState()', () => {
    const state = useHerbariumStore.getState();
    expect(state).toHaveProperty('tick');
    expect(state).toHaveProperty('triggerRefresh');
    expect(typeof state.triggerRefresh).toBe('function');
  });

  it('exports useHerbariumStore as a Zustand hook with getState/setState', () => {
    expect(typeof useHerbariumStore).toBe('function');
    expect(typeof useHerbariumStore.getState).toBe('function');
    expect(typeof useHerbariumStore.setState).toBe('function');
  });
});
