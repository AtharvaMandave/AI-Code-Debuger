const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models and handler
const Challenge = require('../src/models/Challenge');
const generateHandler = require('../src/pages/api/challenge/generate').default;

let mongoServer;

describe('Challenge Generation Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Challenge.deleteMany({});
    global.fetch.mockClear();
  });

  describe('Input Validation', () => {
    test('should reject invalid HTTP method', async () => {
      const req = {
        method: 'GET',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Method not allowed'
      });
    });

    test('should reject invalid language', async () => {
      const req = {
        method: 'POST',
        body: { language: 'invalid-language' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid language specified'
      });
    });

    test('should accept valid languages', async () => {
      const validLanguages = ['javascript', 'python', 'java', 'cpp'];
      
      for (const language of validLanguages) {
        const req = {
          method: 'POST',
          body: { language }
        };

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        // Mock successful API response
        global.fetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    title: 'Test Challenge',
                    description: 'Test description',
                    starterCode: 'function test() {}',
                    solution: 'function test() { return true; }',
                    mode: 'fix-bug',
                    difficulty: 'easy',
                    language: language,
                    tags: ['easy', language, 'test']
                  })
                }]
              }
            }]
          })
        });

        await generateHandler(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.json.mock.calls[0][0];
        expect(response.message).toBe('Challenges generated successfully!');
        expect(response.count).toBeGreaterThan(0);
      }
    });
  });

  describe('API Integration', () => {
    test('should handle successful Gemini API responses', async () => {
      const mockChallenges = [
        {
          title: 'Fix Bug Challenge',
          description: 'Fix the bug in this code',
          starterCode: 'function test() { return false; }',
          solution: 'function test() { return true; }',
          mode: 'fix-bug',
          difficulty: 'easy',
          language: 'javascript',
          tags: ['easy', 'javascript', 'bug']
        },
        {
          title: 'Output Predictor',
          description: 'What will be the output?\n\nconsole.log([1,2,3].map(x => x * 2));',
          starterCode: 'console.log([1,2,3].map(x => x * 2));',
          solution: '[2,4,6]',
          mode: 'output-predictor',
          difficulty: 'medium',
          language: 'javascript',
          tags: ['medium', 'javascript', 'array']
        },
        {
          title: 'Refactor Challenge',
          description: 'Refactor this inefficient code',
          starterCode: 'function removeDuplicates(arr) { /* inefficient code */ }',
          solution: 'function removeDuplicates(arr) { return [...new Set(arr)]; }',
          mode: 'refactor-rush',
          difficulty: 'hard',
          language: 'javascript',
          tags: ['hard', 'javascript', 'refactor']
        }
      ];

      let callCount = 0;
      global.fetch.mockImplementation(() => {
        const challenge = mockChallenges[callCount % mockChallenges.length];
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify(challenge)
                }]
              }
            }]
          })
        });
      });

      const req = {
        method: 'POST',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Challenges generated successfully!');
      expect(response.count).toBe(9); // 3 modes × 3 difficulties
      expect(response.apiErrors).toBe(0);

      // Verify challenges were created
      const challenges = await Challenge.find({});
      expect(challenges).toHaveLength(9);
      
      // Verify all modes are present
      const modes = [...new Set(challenges.map(c => c.mode))];
      expect(modes).toContain('fix-bug');
      expect(modes).toContain('output-predictor');
      expect(modes).toContain('refactor-rush');
    });

    test('should handle API failures gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'));

      const req = {
        method: 'POST',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Challenges generated successfully!');
      expect(response.apiErrors).toBeGreaterThan(0);

      // Verify fallback challenges were created
      const challenges = await Challenge.find({});
      expect(challenges.length).toBeGreaterThan(0);
      
      // Verify fallback challenges have correct structure
      const fallbackChallenge = challenges[0];
      expect(fallbackChallenge.title).toContain('FIX-BUG');
      expect(fallbackChallenge.mode).toBe('fix-bug');
      expect(fallbackChallenge.language).toBe('javascript');
    });

    test('should handle malformed JSON responses', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: 'Invalid JSON response'
              }]
            }
          }]
        })
      });

      const req = {
        method: 'POST',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.apiErrors).toBeGreaterThan(0);

      // Verify fallback challenges were created
      const challenges = await Challenge.find({});
      expect(challenges.length).toBeGreaterThan(0);
    });

    test('should stop generation after too many API errors', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'));

      const req = {
        method: 'POST',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.apiErrors).toBeGreaterThanOrEqual(3);
      
      // Should have created some fallback challenges before stopping
      const challenges = await Challenge.find({});
      expect(challenges.length).toBeGreaterThan(0);
      expect(challenges.length).toBeLessThan(9); // Should not create all 9
    });
  });

  describe('Fallback Challenge Generation', () => {
    test('should create appropriate fallback challenges for each mode', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'));

      const req = {
        method: 'POST',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      const challenges = await Challenge.find({});
      
      // Check for fix-bug challenges
      const fixBugChallenges = challenges.filter(c => c.mode === 'fix-bug');
      expect(fixBugChallenges.length).toBeGreaterThan(0);
      expect(fixBugChallenges[0].starterCode).toContain('bubbleSort');
      expect(fixBugChallenges[0].solution).toContain('bubbleSort');

      // Check for output-predictor challenges
      const outputChallenges = challenges.filter(c => c.mode === 'output-predictor');
      expect(outputChallenges.length).toBeGreaterThan(0);
      expect(outputChallenges[0].description).toContain('What will be the output');
      expect(outputChallenges[0].solution).toBe('[2,4,6]');

      // Check for refactor-rush challenges
      const refactorChallenges = challenges.filter(c => c.mode === 'refactor-rush');
      expect(refactorChallenges.length).toBeGreaterThan(0);
      expect(refactorChallenges[0].starterCode).toContain('removeDuplicates');
      expect(refactorChallenges[0].solution).toContain('Set');
    });

    test('should create fallback challenges for different languages', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'));

      const languages = ['python', 'java', 'cpp'];
      
      for (const language of languages) {
        await Challenge.deleteMany({});
        
        const req = {
          method: 'POST',
          body: { language }
        };

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await generateHandler(req, res);

        const challenges = await Challenge.find({});
        expect(challenges.length).toBeGreaterThan(0);
        
        // Verify all challenges have the correct language
        challenges.forEach(challenge => {
          expect(challenge.language).toBe(language);
        });
      }
    });
  });

  describe('Challenge Validation', () => {
    test('should validate required fields in generated challenges', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  title: 'Test Challenge',
                  description: 'Test description',
                  starterCode: 'function test() {}',
                  solution: 'function test() { return true; }',
                  mode: 'fix-bug',
                  difficulty: 'easy',
                  language: 'javascript',
                  tags: ['easy', 'javascript', 'test']
                })
              }]
            }
          }]
        })
      });

      const req = {
        method: 'POST',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      const challenges = await Challenge.find({});
      expect(challenges.length).toBeGreaterThan(0);

      // Verify all challenges have required fields
      challenges.forEach(challenge => {
        expect(challenge.title).toBeTruthy();
        expect(challenge.description).toBeTruthy();
        expect(challenge.starterCode).toBeTruthy();
        expect(challenge.solution).toBeTruthy();
        expect(challenge.mode).toBeTruthy();
        expect(challenge.language).toBeTruthy();
        expect(challenge.difficulty).toBeTruthy();
      });
    });

    test('should handle missing required fields in API response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  title: 'Test Challenge'
                  // Missing other required fields
                })
              }]
            }
          }]
        })
      });

      const req = {
        method: 'POST',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.apiErrors).toBeGreaterThan(0);

      // Should create fallback challenges
      const challenges = await Challenge.find({});
      expect(challenges.length).toBeGreaterThan(0);
    });
  });

  describe('Database Operations', () => {
    test('should clear existing challenges before generating new ones', async () => {
      // Create some existing challenges
      await Challenge.create([
        {
          title: 'Existing Challenge 1',
          description: 'Test description',
          starterCode: 'function test() {}',
          solution: 'function test() { return true; }',
          mode: 'fix-bug',
          language: 'javascript',
          difficulty: 'easy'
        },
        {
          title: 'Existing Challenge 2',
          description: 'Test description',
          starterCode: 'function test() {}',
          solution: 'function test() { return true; }',
          mode: 'output-predictor',
          language: 'javascript',
          difficulty: 'medium'
        }
      ]);

      expect(await Challenge.countDocuments()).toBe(2);

      global.fetch.mockRejectedValue(new Error('API Error'));

      const req = {
        method: 'POST',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      // Should have cleared existing challenges and created new ones
      const challenges = await Challenge.find({});
      expect(challenges.length).toBeGreaterThan(0);
      
      // Verify old challenges are gone
      const oldChallenges = challenges.filter(c => 
        c.title === 'Existing Challenge 1' || c.title === 'Existing Challenge 2'
      );
      expect(oldChallenges).toHaveLength(0);
    });

    test('should set correct week number for generated challenges', async () => {
      global.fetch.mockRejectedValue(new Error('API Error'));

      const req = {
        method: 'POST',
        body: { language: 'javascript' }
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await generateHandler(req, res);

      const challenges = await Challenge.find({});
      expect(challenges.length).toBeGreaterThan(0);

      // All challenges should have the same week number
      const weekNumbers = [...new Set(challenges.map(c => c.weekNumber))];
      expect(weekNumbers).toHaveLength(1);
      expect(weekNumbers[0]).toBeGreaterThan(0);
    });
  });
}); 