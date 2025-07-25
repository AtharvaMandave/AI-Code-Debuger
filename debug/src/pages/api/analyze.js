// import fetch from 'node-fetch'; // Not needed in Next.js API routes (Node 18+)
import dbConnect from '../../lib/db';
import Snippet from '../../models/Snippet';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language, level } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  let prompt = '';
  if (level === 'beginner') {
    prompt = `You are an AI code assistant. Given the following code snippet, do the following:\n\nDetect bugs\nSuggest corrections\nExplain in plain English for a beginner (ELI5). Use analogies, metaphors, and visuals. Avoid technical jargon. Use simple terms. Where possible, include related image URLs (e.g., for recursion, include an image of a stack of plates).\nBreak down line-by-line\nReturn a flowchart-friendly JSON of code logic.\n\nFor the visualization, each node should represent a logical block (loop, condition, function call, decision, etc.) and MUST include:\n- code_snippet: the code for that block\n- variables: object of variables in scope or changed in that block (if available)\n- line: line number or range for that block\n\nCode:\n${code}\n\nRespond in JSON:\n{\n"explanation": "...",\n"bugs_detected": true,\n"issues": [],\n"suggested_fix": "...",\n"line_by_line": {},\n"images": ["..."],\n"visualization": {\n"nodes": [ { "id": ..., "type": ..., "label": ..., "code_snippet": ..., "variables": ..., "line": ... } ],\n"edges": [...]\n}\n}`;
  } else if (level === 'intermediate') {
    prompt = `You are an AI code assistant. Given the following code snippet, do the following:\n\nDetect bugs\nSuggest corrections\nExplain in clear, moderately technical English for an intermediate developer. Use some analogies if helpful.\nBreak down line-by-line\nReturn a flowchart-friendly JSON of code logic.\n\nFor the visualization, each node should represent a logical block (loop, condition, function call, decision, etc.) and MUST include:\n- code_snippet: the code for that block\n- variables: object of variables in scope or changed in that block (if available)\n- line: line number or range for that block\n\nCode:\n${code}\n\nRespond in JSON:\n{\n"explanation": "...",\n"bugs_detected": true,\n"issues": [],\n"suggested_fix": "...",\n"line_by_line": {},\n"visualization": {\n"nodes": [ { "id": ..., "type": ..., "label": ..., "code_snippet": ..., "variables": ..., "line": ... } ],\n"edges": [...]\n}\n}`;
  } else {
    prompt = `You are an AI code assistant. Given the following code snippet, do the following:\n\nDetect bugs\nSuggest corrections\nExplain in technical detail for an expert developer. Use precise terminology and in-depth reasoning.\nBreak down line-by-line\nReturn a flowchart-friendly JSON of code logic.\n\nFor the visualization, each node should represent a logical block (loop, condition, function call, decision, etc.) and MUST include:\n- code_snippet: the code for that block\n- variables: object of variables in scope or changed in that block (if available)\n- line: line number or range for that block\n\nCode:\n${code}\n\nRespond in JSON:\n{\n"explanation": "...",\n"bugs_detected": true,\n"issues": [],\n"suggested_fix": "...",\n"line_by_line": {},\n"visualization": {\n"nodes": [ { "id": ..., "type": ..., "label": ..., "code_snippet": ..., "variables": ..., "line": ... } ],\n"edges": [...]\n}\n}`;
  }

  try {
    // Get Clerk user ID
    const { userId } = getAuth(req);
    console.log('DEBUG: Clerk userId:', userId);
    if (!userId) {
      console.error('DEBUG: Not authenticated - Clerk userId missing');
      return res.status(401).json({ error: 'Not authenticated', debug: 'Clerk userId missing' });
    }
    // Gemini API endpoint and payload
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      }),
    });

    if (!geminiRes.ok) {
      const error = await geminiRes.text();
      console.error('Gemini API error:', error);
      return res.status(500).json({ error: 'Gemini API error', details: error });
    }

    const data = await geminiRes.json();
    let aiResponse;
    let content = '';
    try {
      // Gemini's response structure
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Try to extract JSON from code block or text
      let jsonText = content;
      jsonText = extractJsonFromMarkdown(jsonText);
      console.log('DEBUG: Extracted jsonText:', jsonText); // Debug log
      aiResponse = JSON.parse(jsonText);
      // Normalize issues to array of strings for frontend compatibility
      if (Array.isArray(aiResponse.issues)) {
        aiResponse.issues = aiResponse.issues.map(issue => {
          if (typeof issue === 'string') return issue;
          if (typeof issue === 'object' && issue !== null) {
            return issue.description || JSON.stringify(issue);
          }
          return String(issue);
        });
      }
    } catch (e) {
      console.error('Failed to parse Gemini response:', {data, content});
      return res.status(500).json({ error: 'Failed to parse Gemini response', details: data, content, parseError: e.message });
    }

    // Save to MongoDB
    try {
      await dbConnect();
      await Snippet.create({
        code,
        language: language || 'unknown',
        aiResponse,
        createdAt: new Date(),
        userId,
      });
    } catch (dbErr) {
      // Log and return error
      console.error('MongoDB save error:', dbErr);
      return res.status(500).json({ error: 'MongoDB save error', details: dbErr.message });
    }

    return res.status(200).json(aiResponse);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}

// Utility to robustly extract JSON from Markdown code block or plain text
function extractJsonFromMarkdown(content) {
  if (!content) return '';
  // Try to extract the first code block (with or without 'json')
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    content = codeBlockMatch[1];
  }
  // If no code block, try to extract the first {...} JSON object
  const jsonMatch = content.match(/{[\s\S]*}/);
  if (jsonMatch) {
    content = jsonMatch[0];
  }
  return content.trim();
} 