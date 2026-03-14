/**
 * Tests for Plant.id v3 API integration.
 * fetch and expo-file-system are mocked — tests cover parsing logic only.
 */

// Mock expo-file-system before importing service
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: { Base64: 'base64' },
}));

// Mock global fetch
global.fetch = jest.fn();

import * as FileSystem from 'expo-file-system';
import { identifyPlant } from '@/services/plantId';

const mockReadAsStringAsync = FileSystem.readAsStringAsync as jest.Mock;
const mockFetch = fetch as jest.Mock;

const MOCK_BASE64 = 'iVBORw0KGgo='; // fake base64

function makeApiResponse(isPlant: boolean, confidence: number, name: string) {
  return {
    result: {
      is_plant: { probability: isPlant ? 0.99 : 0.01, binary: isPlant },
      classification: {
        suggestions: [
          { name, probability: confidence },
        ],
      },
    },
  };
}

beforeEach(() => {
  mockReadAsStringAsync.mockResolvedValue(MOCK_BASE64);
  mockFetch.mockReset();
});

describe('identifyPlant – successful identification', () => {
  it('returns matched=true for high-confidence plant', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(true, 0.85, 'Prunus × yedoensis'),
    });

    const result = await identifyPlant('file:///photo.jpg');
    expect(result.matched).toBe(true);
    expect(result.isPlant).toBe(true);
    expect(result.confidence).toBeCloseTo(0.85);
    expect(result.plantName).toBe('Prunus × yedoensis');
  });

  it('returns matched=false when confidence < 0.4', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(true, 0.25, 'Unknown plant'),
    });

    const result = await identifyPlant('file:///photo.jpg');
    expect(result.matched).toBe(false);
    expect(result.isPlant).toBe(true);
    expect(result.confidence).toBeCloseTo(0.25);
  });

  it('returns matched=false and isPlant=false when not a plant', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(false, 0.9, 'Rock'),
    });

    const result = await identifyPlant('file:///photo.jpg');
    expect(result.matched).toBe(false);
    expect(result.isPlant).toBe(false);
  });

  it('returns matched=true at exactly 0.4 confidence (boundary inclusive)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(true, 0.4, 'Taraxacum officinale'),
    });

    const result = await identifyPlant('file:///photo.jpg');
    expect(result.matched).toBe(true);
  });
});

describe('identifyPlant – error handling', () => {
  it('throws on non-ok HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'rate limited' }),
    });

    await expect(identifyPlant('file:///photo.jpg')).rejects.toThrow();
  });

  it('throws on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(identifyPlant('file:///photo.jpg')).rejects.toThrow('Network error');
  });

  it('sends correct headers and body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => makeApiResponse(true, 0.9, 'Rosa'),
    });

    await identifyPlant('file:///photo.jpg');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('plant.id'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: expect.stringContaining(MOCK_BASE64),
      }),
    );
  });
});
