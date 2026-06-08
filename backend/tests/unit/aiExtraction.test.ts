const mockCreate = jest.fn();

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import { extractWithAI } from '../../src/modules/intelligence/aiExtraction';

describe('AI Extraction Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('extracts name from transcript', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ name: 'Ramesh', intent: 'property inquiry', sentiment: 'neutral', callbackRequested: true })
          }
        }
      ]
    });

    const result = await extractWithAI('Main Ramesh bol raha hoon...');
    expect(result.name).toBe('Ramesh');
  });

  test('handles missing name gracefully', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ name: null, intent: 'complaint', sentiment: 'negative', callbackRequested: false })
          }
        }
      ]
    });

    const result = await extractWithAI('No one is answering.');
    expect(result.name).toBeNull();
    expect(result.sentiment).toBe('negative');
  });

  test('handles empty transcript', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ name: null, intent: null, sentiment: 'neutral', callbackRequested: false })
          }
        }
      ]
    });

    const result = await extractWithAI('');
    expect(result.name).toBeNull();
    expect(result.intent).toBeNull();
  });
});
