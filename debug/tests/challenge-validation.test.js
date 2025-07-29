const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Import models
const Challenge = require('../src/models/Challenge');
const UserGameStats = require('../src/models/UserGameStats');

let mongoServer;

describe('Challenge Validation Tests', () => {
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
    await UserGameStats.deleteMany({});
  });

  describe('Challenge Model Validation', () => {
    test('should create valid challenge', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'easy',
        tags: ['easy', 'javascript', 'test']
      };

      const challenge = new Challenge(challengeData);
      await expect(challenge.save()).resolves.toBeDefined();

      expect(challenge.title).toBe('Test Challenge');
      expect(challenge.mode).toBe('fix-bug');
      expect(challenge.language).toBe('javascript');
      expect(challenge.difficulty).toBe('easy');
      expect(challenge.tags).toEqual(['easy', 'javascript', 'test']);
    });

    test('should reject challenge without required fields', async () => {
      const invalidChallenge = new Challenge({
        title: 'Test Challenge'
        // Missing required fields
      });

      await expect(invalidChallenge.save()).rejects.toThrow();
    });

    test('should reject invalid mode', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'invalid-mode',
        language: 'javascript',
        difficulty: 'easy'
      };

      const challenge = new Challenge(challengeData);
      await expect(challenge.save()).rejects.toThrow();
    });

    test('should reject invalid language', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'fix-bug',
        language: 'invalid-language',
        difficulty: 'easy'
      };

      const challenge = new Challenge(challengeData);
      await expect(challenge.save()).rejects.toThrow();
    });

    test('should reject invalid difficulty', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'invalid-difficulty'
      };

      const challenge = new Challenge(challengeData);
      await expect(challenge.save()).rejects.toThrow();
    });

    test('should enforce title length limit', async () => {
      const longTitle = 'A'.repeat(201); // Exceeds 200 character limit
      
      const challengeData = {
        title: longTitle,
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'easy'
      };

      const challenge = new Challenge(challengeData);
      await expect(challenge.save()).rejects.toThrow();
    });

    test('should enforce tags limit', async () => {
      const manyTags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
      
      const challengeData = {
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'easy',
        tags: manyTags
      };

      const challenge = new Challenge(challengeData);
      await expect(challenge.save()).rejects.toThrow();
    });

    test('should make tags unique', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'easy',
        tags: ['javascript', 'javascript', 'test', 'test']
      };

      const challenge = new Challenge(challengeData);
      await challenge.save();

      expect(challenge.tags).toEqual(['javascript', 'test']);
    });

    test('should add code to output-predictor description if missing', async () => {
      const challengeData = {
        title: 'Test Challenge',
        description: 'What will be the output?',
        starterCode: 'console.log([1,2,3].map(x => x * 2));',
        solution: '[2,4,6]',
        mode: 'output-predictor',
        language: 'javascript',
        difficulty: 'easy'
      };

      const challenge = new Challenge(challengeData);
      await challenge.save();

      expect(challenge.description).toContain('Code to analyze:');
      expect(challenge.description).toContain('console.log([1,2,3].map(x => x * 2));');
    });
  });

  describe('Challenge Model Methods', () => {
    test('should validate complete challenge', async () => {
      const completeChallenge = await Challenge.create({
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'easy'
      });

      expect(completeChallenge.isComplete()).toBe(true);
    });

    test('should detect incomplete challenge', async () => {
      const incompleteChallenge = new Challenge({
        title: 'Test Challenge',
        description: 'Test description',
        // Missing other required fields
      });

      expect(incompleteChallenge.isComplete()).toBe(false);
    });

    test('should find challenges by criteria', async () => {
      await Challenge.create([
        {
          title: 'JavaScript Challenge',
          description: 'Test description',
          starterCode: 'function test() {}',
          solution: 'function test() { return true; }',
          mode: 'fix-bug',
          language: 'javascript',
          difficulty: 'easy'
        },
        {
          title: 'Python Challenge',
          description: 'Test description',
          starterCode: 'def test(): pass',
          solution: 'def test(): return True',
          mode: 'output-predictor',
          language: 'python',
          difficulty: 'medium'
        }
      ]);

      const jsChallenges = await Challenge.findByCriteria({ language: 'javascript' });
      expect(jsChallenges).toHaveLength(1);
      expect(jsChallenges[0].language).toBe('javascript');

      const pythonChallenges = await Challenge.findByCriteria({ language: 'python' });
      expect(pythonChallenges).toHaveLength(1);
      expect(pythonChallenges[0].language).toBe('python');

      const fixBugChallenges = await Challenge.findByCriteria({ mode: 'fix-bug' });
      expect(fixBugChallenges).toHaveLength(1);
      expect(fixBugChallenges[0].mode).toBe('fix-bug');
    });
  });

  describe('UserGameStats Model Validation', () => {
    test('should create valid user stats', async () => {
      const userStats = new UserGameStats({
        userId: 'test-user'
      });

      await expect(userStats.save()).resolves.toBeDefined();

      expect(userStats.userId).toBe('test-user');
      expect(userStats.xp).toBe(0);
      expect(userStats.rank).toBe('Bronze');
      expect(userStats.attempts).toBe(0);
      expect(userStats.completedChallenges).toHaveLength(0);
    });

    test('should reject user stats without userId', async () => {
      const userStats = new UserGameStats({
        xp: 100
      });

      await expect(userStats.save()).rejects.toThrow();
    });

    test('should reject negative XP', async () => {
      const userStats = new UserGameStats({
        userId: 'test-user',
        xp: -10
      });

      await expect(userStats.save()).rejects.toThrow();
    });

    test('should reject invalid rank', async () => {
      const userStats = new UserGameStats({
        userId: 'test-user',
        rank: 'invalid-rank'
      });

      await expect(userStats.save()).rejects.toThrow();
    });

    test('should reject negative attempts', async () => {
      const userStats = new UserGameStats({
        userId: 'test-user',
        attempts: -5
      });

      await expect(userStats.save()).rejects.toThrow();
    });

    test('should reject too many completed challenges', async () => {
      const manyChallenges = Array.from({ length: 1001 }, () => new mongoose.Types.ObjectId());
      
      const userStats = new UserGameStats({
        userId: 'test-user',
        completedChallenges: manyChallenges
      });

      await expect(userStats.save()).rejects.toThrow();
    });
  });

  describe('UserGameStats Model Methods', () => {
    test('should update rank based on XP', async () => {
      const userStats = new UserGameStats({
        userId: 'test-user',
        xp: 0
      });

      expect(userStats.rank).toBe('Bronze');

      userStats.xp = 25;
      await userStats.save();
      expect(userStats.rank).toBe('Bronze');

      userStats.xp = 50;
      await userStats.save();
      expect(userStats.rank).toBe('Silver');

      userStats.xp = 75;
      await userStats.save();
      expect(userStats.rank).toBe('Gold');

      userStats.xp = 100;
      await userStats.save();
      expect(userStats.rank).toBe('Diamond');
    });

    test('should add completed challenge correctly', async () => {
      const challenge = await Challenge.create({
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'easy'
      });

      const userStats = new UserGameStats({
        userId: 'test-user',
        xp: 10
      });

      const result = userStats.addCompletedChallenge(challenge._id, 15);
      expect(result).toBe(true);
      expect(userStats.xp).toBe(25);
      expect(userStats.completedChallenges).toContain(challenge._id);
      expect(userStats.totalCorrect).toBe(1);

      // Should not add the same challenge twice
      const result2 = userStats.addCompletedChallenge(challenge._id, 15);
      expect(result2).toBe(false);
      expect(userStats.xp).toBe(25); // Should not increase
    });

    test('should add incorrect attempt correctly', async () => {
      const userStats = new UserGameStats({
        userId: 'test-user',
        attempts: 5,
        totalIncorrect: 3
      });

      userStats.addIncorrectAttempt();

      expect(userStats.attempts).toBe(6);
      expect(userStats.totalIncorrect).toBe(4);
    });

    test('should calculate completion rate correctly', async () => {
      const userStats = new UserGameStats({
        userId: 'test-user',
        totalCorrect: 8,
        totalIncorrect: 2
      });

      const completionRate = userStats.getCompletionRate();
      expect(completionRate).toBe(80); // 8/10 * 100
    });

    test('should return 0 completion rate for no attempts', async () => {
      const userStats = new UserGameStats({
        userId: 'test-user',
        totalCorrect: 0,
        totalIncorrect: 0
      });

      const completionRate = userStats.getCompletionRate();
      expect(completionRate).toBe(0);
    });

    test('should calculate average score correctly', async () => {
      const userStats = new UserGameStats({
        userId: 'test-user',
        totalCorrect: 8,
        totalIncorrect: 2
      });

      await userStats.save();
      expect(userStats.averageScore).toBe(8); // (8/10) * 10
    });
  });

  describe('UserGameStats Static Methods', () => {
    test('should get leaderboard correctly', async () => {
      await UserGameStats.create([
        {
          userId: 'user1',
          xp: 100,
          rank: 'Diamond',
          attempts: 10,
          totalCorrect: 8,
          totalIncorrect: 2,
          averageScore: 8
        },
        {
          userId: 'user2',
          xp: 50,
          rank: 'Silver',
          attempts: 5,
          totalCorrect: 4,
          totalIncorrect: 1,
          averageScore: 8
        },
        {
          userId: 'user3',
          xp: 25,
          rank: 'Bronze',
          attempts: 3,
          totalCorrect: 2,
          totalIncorrect: 1,
          averageScore: 6.67
        }
      ]);

      const leaderboard = await UserGameStats.getLeaderboard(2);
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].userId).toBe('user1'); // Highest XP
      expect(leaderboard[1].userId).toBe('user2'); // Second highest XP
    });

    test('should get user stats with populated challenges', async () => {
      const challenge = await Challenge.create({
        title: 'Test Challenge',
        description: 'Test description',
        starterCode: 'function test() {}',
        solution: 'function test() { return true; }',
        mode: 'fix-bug',
        language: 'javascript',
        difficulty: 'easy'
      });

      const userStats = await UserGameStats.create({
        userId: 'test-user',
        xp: 50,
        rank: 'Silver',
        completedChallenges: [challenge._id]
      });

      const retrievedStats = await UserGameStats.getUserStats('test-user');
      expect(retrievedStats).toBeDefined();
      expect(retrievedStats.userId).toBe('test-user');
      expect(retrievedStats.completedChallenges).toHaveLength(1);
      expect(retrievedStats.completedChallenges[0].title).toBe('Test Challenge');
    });
  });

  describe('Database Indexes', () => {
    test('should have proper indexes for performance', async () => {
      const challengeIndexes = await Challenge.collection.getIndexes();
      const userStatsIndexes = await UserGameStats.collection.getIndexes();

      // Check Challenge indexes
      expect(challengeIndexes).toHaveProperty('mode_1_difficulty_1_language_1');
      expect(challengeIndexes).toHaveProperty('weekNumber_1_language_1');
      expect(challengeIndexes).toHaveProperty('createdAt_-1');

      // Check UserGameStats indexes
      expect(userStatsIndexes).toHaveProperty('xp_-1');
      expect(userStatsIndexes).toHaveProperty('rank_1');
      expect(userStatsIndexes).toHaveProperty('lastPlayed_-1');
    });
  });
}); 