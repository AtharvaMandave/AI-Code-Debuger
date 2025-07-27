const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: String,
  description: String,
  starterCode: String,
  solution: String, // For validation or hints
  mode: { type: String, enum: ['fix-bug', 'output-predictor', 'refactor-rush'] },
  tags: [String], // e.g., ['easy', 'javascript', 'sorting']
  language: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  weekNumber: { type: Number, default: 1 }, // For weekly contests
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema); 