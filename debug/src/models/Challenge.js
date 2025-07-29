const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    trim: true
  },
  starterCode: { 
    type: String, 
    required: [true, 'Starter code is required'],
    trim: true
  },
  solution: { 
    type: String, 
    required: [true, 'Solution is required'],
    trim: true
  },
  mode: { 
    type: String, 
    enum: {
      values: ['fix-bug', 'output-predictor', 'refactor-rush'],
      message: 'Mode must be one of: fix-bug, output-predictor, refactor-rush'
    },
    required: [true, 'Mode is required']
  },
  tags: { 
    type: [String], 
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10; // Max 10 tags
      },
      message: 'Cannot have more than 10 tags'
    }
  },
  language: { 
    type: String, 
    required: [true, 'Language is required'],
    enum: {
      values: ['javascript', 'python', 'java', 'cpp'],
      message: 'Language must be one of: javascript, python, java, cpp'
    }
  },
  difficulty: { 
    type: String, 
    enum: {
      values: ['easy', 'medium', 'hard'],
      message: 'Difficulty must be one of: easy, medium, hard'
    },
    required: [true, 'Difficulty is required']
  },
  weekNumber: { 
    type: Number, 
    default: 1,
    min: [1, 'Week number must be at least 1']
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Add indexes for better query performance
ChallengeSchema.index({ mode: 1, difficulty: 1, language: 1 });
ChallengeSchema.index({ weekNumber: 1, language: 1 });
ChallengeSchema.index({ createdAt: -1 });

// Pre-save middleware to validate challenge data
ChallengeSchema.pre('save', function(next) {
  // Ensure tags are unique
  if (this.tags) {
    this.tags = [...new Set(this.tags)];
  }
  
  // Validate that output-predictor challenges have code in description
  if (this.mode === 'output-predictor' && !this.description.includes('code')) {
    this.description += '\n\nCode to analyze:\n' + this.starterCode;
  }
  
  next();
});

// Instance method to validate challenge completeness
ChallengeSchema.methods.isComplete = function() {
  return this.title && 
         this.description && 
         this.starterCode && 
         this.solution && 
         this.mode && 
         this.language && 
         this.difficulty;
};

// Static method to find challenges by criteria
ChallengeSchema.statics.findByCriteria = function(criteria) {
  const filter = {};
  
  if (criteria.mode) filter.mode = criteria.mode;
  if (criteria.difficulty) filter.difficulty = criteria.difficulty;
  if (criteria.language) filter.language = criteria.language;
  if (criteria.weekNumber) filter.weekNumber = criteria.weekNumber;
  
  return this.find(filter).sort({ createdAt: -1 });
};

module.exports = mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema); 