const mongoose = require('mongoose');

const UserGameStatsSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: [true, 'User ID is required'], 
    unique: true,
    trim: true
  },
  xp: { 
    type: Number, 
    default: 0,
    min: [0, 'XP cannot be negative']
  },
  rank: { 
    type: String, 
    default: 'Bronze',
    enum: {
      values: ['Rookie', 'Bronze', 'Silver', 'Gold', 'Diamond'],
      message: 'Rank must be one of: Rookie, Bronze, Silver, Gold, Diamond'
    }
  },
  attempts: { 
    type: Number, 
    default: 0,
    min: [0, 'Attempts cannot be negative']
  },
  completedChallenges: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Challenge',
    validate: {
      validator: function(v) {
        return v.length <= 1000; // Max 1000 completed challenges
      },
      message: 'Cannot have more than 1000 completed challenges'
    }
  }],
  lastPlayed: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  // Additional stats for better analytics
  totalCorrect: {
    type: Number,
    default: 0,
    min: [0, 'Total correct cannot be negative']
  },
  totalIncorrect: {
    type: Number,
    default: 0,
    min: [0, 'Total incorrect cannot be negative']
  },
  averageScore: {
    type: Number,
    default: 0,
    min: [0, 'Average score cannot be negative'],
    max: [10, 'Average score cannot exceed 10']
  },
  preferredLanguage: {
    type: String,
    enum: {
      values: ['javascript', 'python', 'java', 'cpp'],
      message: 'Preferred language must be one of: javascript, python, java, cpp'
    }
  },
  preferredMode: {
    type: String,
    enum: {
      values: ['fix-bug', 'output-predictor', 'refactor-rush'],
      message: 'Preferred mode must be one of: fix-bug, output-predictor, refactor-rush'
    }
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
UserGameStatsSchema.index({ xp: -1 });
UserGameStatsSchema.index({ rank: 1 });
UserGameStatsSchema.index({ lastPlayed: -1 });

// Pre-save middleware to update rank based on XP
UserGameStatsSchema.pre('save', function(next) {
  // Update rank based on XP
  if (this.xp >= 100) this.rank = 'Diamond';
  else if (this.xp >= 75) this.rank = 'Gold';
  else if (this.xp >= 50) this.rank = 'Silver';
  else if (this.xp >= 25) this.rank = 'Bronze';
  else this.rank = 'Rookie';
  
  // Calculate average score
  const totalAttempts = this.totalCorrect + this.totalIncorrect;
  if (totalAttempts > 0) {
    this.averageScore = (this.totalCorrect / totalAttempts) * 10;
  }
  
  next();
});

// Instance method to add a completed challenge
UserGameStatsSchema.methods.addCompletedChallenge = function(challengeId, xpEarned) {
  if (!this.completedChallenges.includes(challengeId)) {
    this.completedChallenges.push(challengeId);
    this.xp += xpEarned;
    this.totalCorrect += 1;
    this.lastPlayed = new Date();
    return true;
  }
  return false;
};

// Instance method to add an incorrect attempt
UserGameStatsSchema.methods.addIncorrectAttempt = function() {
  this.attempts += 1;
  this.totalIncorrect += 1;
  this.lastPlayed = new Date();
};

// Instance method to get completion rate
UserGameStatsSchema.methods.getCompletionRate = function() {
  const totalAttempts = this.totalCorrect + this.totalIncorrect;
  return totalAttempts > 0 ? (this.totalCorrect / totalAttempts) * 100 : 0;
};

// Static method to get leaderboard
UserGameStatsSchema.statics.getLeaderboard = function(limit = 20) {
  return this.find({})
    .sort({ xp: -1, lastPlayed: -1 })
    .limit(limit)
    .select('userId xp rank attempts totalCorrect totalIncorrect averageScore lastPlayed');
};

// Static method to get user stats by ID
UserGameStatsSchema.statics.getUserStats = function(userId) {
  return this.findOne({ userId })
    .populate('completedChallenges', 'title mode difficulty language')
    .select('-__v');
};

module.exports = mongoose.models.UserGameStats || mongoose.model('UserGameStats', UserGameStatsSchema); 