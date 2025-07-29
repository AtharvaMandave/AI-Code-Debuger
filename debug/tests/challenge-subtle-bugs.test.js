const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models and handler
const Challenge = require('../src/models/Challenge');
const generateHandler = require('../src/pages/api/challenge/generate').default;

let mongoServer;

describe('Challenge Subtle Bug Tests', () => {
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

  describe('Fix Bug Mode - Subtle Bugs', () => {
    test('should generate challenges with subtle bugs (no obvious comments)', async () => {
      // Mock AI response with subtle bug
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  title: 'Fix the Array Sum Bug',
                  description: 'The function should return the sum of all elements in the array, but it has a bug.',
                  starterCode: 'function sumArray(arr) {\n  let sum = 0;\n  for (let i = 0; i <= arr.length; i++) {\n    sum += arr[i];\n  }\n  return sum;\n}',
                  solution: 'function sumArray(arr) {\n  let sum = 0;\n  for (let i = 0; i < arr.length; i++) {\n    sum += arr[i];\n  }\n  return sum;\n}',
                  mode: 'fix-bug',
                  difficulty: 'easy',
                  language: 'javascript',
                  tags: ['easy', 'javascript', 'array']
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
      
      // Check that challenges were created
      const challenges = await Challenge.find({ mode: 'fix-bug' });
      expect(challenges.length).toBeGreaterThan(0);

      // Verify the bug is subtle (no obvious comments)
      const fixBugChallenge = challenges.find(c => c.title.includes('Array Sum'));
      if (fixBugChallenge) {
        expect(fixBugChallenge.starterCode).not.toContain('BUG:');
        expect(fixBugChallenge.starterCode).not.toContain('FIX:');
        expect(fixBugChallenge.starterCode).not.toContain('// BUG');
        expect(fixBugChallenge.starterCode).not.toContain('/* BUG');
        expect(fixBugChallenge.starterCode).not.toContain('ERROR:');
        
        // The bug should be in the logic, not in comments
        expect(fixBugChallenge.starterCode).toContain('i <= arr.length'); // This is the bug
        expect(fixBugChallenge.solution).toContain('i < arr.length'); // This is the fix
      }
    });

    test('should handle fallback challenges with subtle bugs', async () => {
      // Mock API failure to trigger fallback
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
      
      // Check that fallback challenges were created
      const challenges = await Challenge.find({ mode: 'fix-bug' });
      expect(challenges.length).toBeGreaterThan(0);

      // Verify fallback bugs are also subtle
      challenges.forEach(challenge => {
        expect(challenge.starterCode).not.toContain('BUG:');
        expect(challenge.starterCode).not.toContain('FIX:');
        expect(challenge.starterCode).not.toContain('// BUG');
        expect(challenge.starterCode).not.toContain('/* BUG');
        
        // Should contain the actual bug (wrong comparison operator)
        expect(challenge.starterCode).toContain('arr[j] < arr[j + 1]');
        expect(challenge.solution).toContain('arr[j] > arr[j + 1]');
      });
    });
  });

  describe('Refactor Rush Mode - Subtle Inefficiencies', () => {
    test('should generate challenges with subtle inefficiencies', async () => {
      // Mock AI response with subtle inefficiency
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  title: 'Optimize the Duplicate Finder',
                  description: 'This function finds duplicates but can be optimized.',
                  starterCode: 'function findDuplicates(arr) {\n  let duplicates = [];\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = i + 1; j < arr.length; j++) {\n      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {\n        duplicates.push(arr[i]);\n      }\n    }\n  }\n  return duplicates;\n}',
                  solution: 'function findDuplicates(arr) {\n  const seen = new Set();\n  const duplicates = new Set();\n  for (let item of arr) {\n    if (seen.has(item)) {\n      duplicates.add(item);\n    } else {\n      seen.add(item);\n    }\n  }\n  return Array.from(duplicates);\n}',
                  mode: 'refactor-rush',
                  difficulty: 'medium',
                  language: 'javascript',
                  tags: ['medium', 'javascript', 'optimization']
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
      
      // Check that challenges were created
      const challenges = await Challenge.find({ mode: 'refactor-rush' });
      expect(challenges.length).toBeGreaterThan(0);

      // Verify the inefficiency is subtle (no obvious comments)
      const refactorChallenge = challenges.find(c => c.title.includes('Duplicate'));
      if (refactorChallenge) {
        expect(refactorChallenge.starterCode).not.toContain('INEFFICIENT:');
        expect(refactorChallenge.starterCode).not.toContain('SLOW:');
        expect(refactorChallenge.starterCode).not.toContain('// SLOW');
        expect(refactorChallenge.starterCode).not.toContain('/* INEFFICIENT');
        
        // Should contain the actual inefficiency (nested loops)
        expect(refactorChallenge.starterCode).toContain('for (let i = 0; i < arr.length; i++)');
        expect(refactorChallenge.starterCode).toContain('for (let j = i + 1; j < arr.length; j++)');
        expect(refactorChallenge.solution).toContain('Set');
      }
    });
  });

  describe('Output Predictor Mode - Clean Code', () => {
    test('should generate clean code for output prediction', async () => {
      // Mock AI response with clean code
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  title: 'Predict the Output',
                  description: 'What will be the output of the following code?\n\nconst numbers = [1, 2, 3, 4, 5];\nconst doubled = numbers.map(n => n * 2).filter(n => n > 5);\nconsole.log(doubled);',
                  starterCode: '',
                  solution: '[6, 8, 10]',
                  mode: 'output-predictor',
                  difficulty: 'easy',
                  language: 'javascript',
                  tags: ['easy', 'javascript', 'array']
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
      
      // Check that challenges were created
      const challenges = await Challenge.find({ mode: 'output-predictor' });
      expect(challenges.length).toBeGreaterThan(0);

      // Verify the code is clean and in description
      const outputChallenge = challenges.find(c => c.title.includes('Predict'));
      if (outputChallenge) {
        expect(outputChallenge.description).toContain('const numbers = [1, 2, 3, 4, 5];');
        expect(outputChallenge.description).toContain('console.log(doubled);');
        expect(outputChallenge.starterCode).toBe('');
        expect(outputChallenge.solution).toBe('[6, 8, 10]');
      }
    });
  });

  describe('Validation of Generated Challenges', () => {
    test('should validate that all generated challenges follow subtle bug guidelines', async () => {
      // Mock multiple AI responses
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    title: 'Fix the Loop Bug',
                    description: 'This function has a subtle bug in the loop condition.',
                    starterCode: 'function countElements(arr) {\n  let count = 0;\n  for (let i = 0; i <= arr.length; i++) {\n    count++;\n  }\n  return count;\n}',
                    solution: 'function countElements(arr) {\n  let count = 0;\n  for (let i = 0; i < arr.length; i++) {\n    count++;\n  }\n  return count;\n}',
                    mode: 'fix-bug',
                    difficulty: 'easy',
                    language: 'javascript',
                    tags: ['easy', 'javascript', 'loop']
                  })
                }]
              }
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({
                    title: 'Optimize String Search',
                    description: 'This function searches for a substring but can be optimized.',
                    starterCode: 'function findSubstring(str, substr) {\n  for (let i = 0; i < str.length; i++) {\n    let found = true;\n    for (let j = 0; j < substr.length; j++) {\n      if (str[i + j] !== substr[j]) {\n        found = false;\n        break;\n      }\n    }\n    if (found) return i;\n  }\n  return -1;\n}',
                    solution: 'function findSubstring(str, substr) {\n  return str.indexOf(substr);\n}',
                    mode: 'refactor-rush',
                    difficulty: 'medium',
                    language: 'javascript',
                    tags: ['medium', 'javascript', 'string']
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
      
      // Validate all generated challenges
      const allChallenges = await Challenge.find({});
      expect(allChallenges.length).toBeGreaterThan(0);

      allChallenges.forEach(challenge => {
        // No obvious bug/inefficiency comments
        expect(challenge.starterCode).not.toContain('BUG:');
        expect(challenge.starterCode).not.toContain('FIX:');
        expect(challenge.starterCode).not.toContain('// BUG');
        expect(challenge.starterCode).not.toContain('/* BUG');
        expect(challenge.starterCode).not.toContain('INEFFICIENT:');
        expect(challenge.starterCode).not.toContain('SLOW:');
        expect(challenge.starterCode).not.toContain('// SLOW');
        expect(challenge.starterCode).not.toContain('/* INEFFICIENT');

        // Should have proper structure
        expect(challenge.title).toBeTruthy();
        expect(challenge.description).toBeTruthy();
        expect(challenge.mode).toBeTruthy();
        expect(challenge.language).toBeTruthy();
        expect(challenge.difficulty).toBeTruthy();
      });
    });
  });
}); 