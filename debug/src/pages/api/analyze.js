// import fetch from 'node-fetch'; // Not needed in Next.js API routes (Node 18+)
import dbConnect from '../../lib/db';
import Snippet from '../../models/Snippet';
import { getAuth } from '@clerk/nextjs/server';
import { extractJsonFromMarkdown, parseJsonRobustly, truncateJsonIfNeeded } from '../../lib/json-parser';

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
    prompt = `You are an AI code assistant. Given the following code snippet, do the following:\n\nDetect bugs\nSuggest corrections\nExplain in plain English for a beginner (ELI5). Use analogies, metaphors, and visuals. Avoid technical jargon. Use simple terms. Where possible, include related image URLs (e.g., for recursion, include an image of a stack of plates).\nBreak down line-by-line\nReturn a flowchart-friendly JSON of code logic.\n\nFor the visualization, each node should represent a logical block (loop, condition, function call, decision, etc.) and MUST include:\n- code_snippet: the code for that block\n- variables: object of variables in scope or changed in that block (if available)\n- line: line number or range for that block\n\nCode:\n${code}\n\nCRITICAL: Return ONLY a valid JSON object. No explanations, no markdown, no code blocks. Ensure all strings are properly escaped and all quotes are double quotes.\n\nRespond in this exact JSON structure:\n{\n"explanation": "Your explanation here",\n"bugs_detected": true,\n"issues": ["issue1", "issue2"],\n"suggested_fix": "Your suggested fix here",\n"line_by_line": {"1": "line 1 explanation", "2": "line 2 explanation"},\n"images": ["image_url1", "image_url2"],\n"visualization": {\n"nodes": [{"id": "1", "type": "function", "label": "Function", "code_snippet": "code here", "variables": {"var1": "value1"}, "line": "1-5"}],\n"edges": [{"from": "1", "to": "2"}]\n}\n}`;
  } else if (level === 'intermediate') {
    prompt = `You are an AI code assistant. Given the following code snippet, do the following:\n\nDetect bugs and logical errors\nSuggest corrections with explanations\nExplain the code logic and potential issues\nBreak down line-by-line with technical details\nReturn a flowchart-friendly JSON of code logic.\n\nFor the visualization, each node should represent a logical block (loop, condition, function call, decision, etc.) and MUST include:\n- code_snippet: the code for that block\n- variables: object of variables in scope or changed in that block (if available)\n- line: line number or range for that block\n\nCode:\n${code}\n\nCRITICAL: Return ONLY a valid JSON object. No explanations, no markdown, no code blocks. Ensure all strings are properly escaped and all quotes are double quotes.\n\nRespond in this exact JSON structure:\n{\n"explanation": "Your explanation here",\n"bugs_detected": true,\n"issues": ["issue1", "issue2"],\n"suggested_fix": "Your suggested fix here",\n"line_by_line": {"1": "line 1 explanation", "2": "line 2 explanation"},\n"images": ["image_url1", "image_url2"],\n"visualization": {\n"nodes": [{"id": "1", "type": "function", "label": "Function", "code_snippet": "code here", "variables": {"var1": "value1"}, "line": "1-5"}],\n"edges": [{"from": "1", "to": "2"}]\n}\n}`;
  } else {
    prompt = `You are an AI code assistant. Given the following code snippet, do the following:\n\nDetect bugs, logical errors, and performance issues\nSuggest optimizations and corrections\nProvide detailed technical analysis\nBreak down line-by-line with advanced concepts\nReturn a flowchart-friendly JSON of code logic.\n\nFor the visualization, each node should represent a logical block (loop, condition, function call, decision, etc.) and MUST include:\n- code_snippet: the code for that block\n- variables: object of variables in scope or changed in that block (if available)\n- line: line number or range for that block\n\nCode:\n${code}\n\nCRITICAL: Return ONLY a valid JSON object. No explanations, no markdown, no code blocks. Ensure all strings are properly escaped and all quotes are double quotes.\n\nRespond in this exact JSON structure:\n{\n"explanation": "Your explanation here",\n"bugs_detected": true,\n"issues": ["issue1", "issue2"],\n"suggested_fix": "Your suggested fix here",\n"line_by_line": {"1": "line 1 explanation", "2": "line 2 explanation"},\n"images": ["image_url1", "image_url2"],\n"visualization": {\n"nodes": [{"id": "1", "type": "function", "label": "Function", "code_snippet": "code here", "variables": {"var1": "value1"}, "line": "1-5"}],\n"edges": [{"from": "1", "to": "2"}]\n}\n}`;
  }

  const { userId } = await getAuth(req);
  let aiResponse;

  try {
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
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract JSON using shared utility
    let jsonText = extractJsonFromMarkdown(content);
    
    // Truncate if too large
    jsonText = truncateJsonIfNeeded(jsonText);
    
    // Parse JSON using robust parser with fallback
    const fallbackData = {
      explanation: "Unable to parse full response due to JSON formatting issues. The AI response contained malformed JSON that could not be properly parsed. Please try again with a simpler code snippet or use the Step Debugger feature for more detailed analysis.",
      bugs_detected: false,
      issues: ["JSON parsing failed - response was malformed"],
      suggested_fix: "Try using the Step Debugger feature for more reliable analysis.",
      line_by_line: {},
      images: [],
      visualization: { nodes: [], edges: [] }
    };
    
    aiResponse = parseJsonRobustly(jsonText, fallbackData);
    
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
    console.error('Failed to parse Gemini response:', e.message);
    console.error('Content length:', content.length);
    console.error('Content preview:', content.substring(0, 200));
    
    // Provide more specific error information
    let errorDetails = e.message;
    if (e.message.includes('Bad control character')) {
      errorDetails = 'JSON contains invalid control characters. This is likely due to unescaped newlines or special characters in the AI response.';
    }
    
    return res.status(500).json({ 
      error: 'Failed to parse Gemini response', 
      details: errorDetails,
      contentPreview: content.substring(0, 200) + '...',
      contentLength: content.length
    });
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
} 