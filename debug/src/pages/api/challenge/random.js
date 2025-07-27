import dbConnect from '../../../lib/db';
const Challenge = require('../../../models/Challenge');

export default async function handler(req, res) {
  await dbConnect();
  const { mode, difficulty, language } = req.query;
  const filter = {};
  if (mode) filter.mode = mode;
  if (difficulty) filter.difficulty = difficulty;
  if (language) filter.language = language;
  try {
    const count = await Challenge.countDocuments(filter);
    if (count === 0) return res.status(404).json({ error: 'No challenges found' });
    const random = Math.floor(Math.random() * count);
    const challenge = await Challenge.findOne(filter).skip(random);
    return res.status(200).json(challenge);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
} 