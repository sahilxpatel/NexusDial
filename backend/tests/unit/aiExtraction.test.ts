import { extractWithAI } from '../../src/services/ai.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn()
        })
      };
    })
  };
});

describe('AI Extraction Unit Tests', () => {
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    const genAI = new GoogleGenerativeAI('test-key');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    mockGenerateContent = model.generateContent as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('extracts name from transcript', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ name: 'Ramesh', intent: 'property inquiry', sentiment: 'neutral', callbackRequested: true })
      }
    });

    const result = await extractWithAI('Main Ramesh bol raha hoon...');
    expect(result.name).toBe('Ramesh');
  });

  test('handles missing name gracefully', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ name: null, intent: 'complaint', sentiment: 'negative', callbackRequested: false })
      }
    });

    const result = await extractWithAI('No one is answering.');
    expect(result.name).toBeNull();
    expect(result.sentiment).toBe('negative');
  });

  test('handles empty transcript', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({ name: null, intent: null, sentiment: 'neutral', callbackRequested: false })
      }
    });

    const result = await extractWithAI('');
    expect(result.name).toBeNull();
    expect(result.intent).toBeNull();
  });
});
