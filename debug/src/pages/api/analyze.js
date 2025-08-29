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

  let prompt = `
You are an AI code assistant. Given the following code snippet, perform the following tasks:

- Detect bugs, logical errors${level === 'advanced' ? ', and performance issues' : ''}
- Suggest corrections${level !== 'beginner' ? ' with explanations' : ''}
- ${level === 'beginner'
  ? 'Explain in plain English (ELI5 style), using analogies, metaphors, visuals, and simple terms. Avoid technical jargon. Where possible, include public image URLs to aid understanding (e.g., stack of plates for recursion).'
  : level === 'intermediate'
  ? 'Explain the code logic and potential issues using technical detail suitable for intermediate programmers.'
  : 'Provide deep technical analysis and optimization suggestions with advanced concepts.'}

- Break down the code line-by-line. Use actual line numbers from the user's code. If a block spans multiple lines, use "start-end" format.
- Return a flowchart-friendly JSON of code logic.

IMPORTANT BUG DETECTION RULES:
- Set "bugs_detected": true if you find ANY bugs, errors, or issues in the code
- Set "bugs_detected": false ONLY if the code is completely correct and has no issues
- If you detect bugs, ALWAYS include them in the "issues" array
- Common bugs to detect: undefined variables, syntax errors, logical errors, infinite loops, incorrect comparisons, missing semicolons, wrong function calls, etc.

CRITICAL FIX REQUIREMENTS:
- The "suggested_fix" field should contain ONLY the corrected code, not explanations
- For simple fixes, provide just the corrected line(s) of code that need to be changed
- For complex fixes, provide the complete corrected code
- Do NOT include explanations, comments, or markdown in the suggested_fix
- The fix should be ready to copy-paste and run immediately
- Focus on the MINIMAL change needed to fix the bug
- If fixing a print statement, provide just the corrected print statement
- If fixing a variable assignment, provide just the corrected assignment
- If fixing a function call, provide just the corrected function call

For the visualization, each node MUST include:
- "code_snippet": the code for that block
- "variables": object of variables in scope or modified in that block
- "line": line number or range for that block
- "type": one of "function", "condition", "loop", "call", "return", "declaration", "assignment", "decision", "output", "input"

CRITICAL: Respond ONLY with a valid JSON object. No markdown, no explanations, no code blocks. Do NOT include any text before or after the JSON. All strings must use double quotes and be properly escaped. If the output is too long, prioritize explanation and line-by-line breakdown. Truncate visualization if needed.

Code:
${code}

Respond in this exact JSON structure:
{
  "explanation": "Your explanation here",
  "bugs_detected": true/false,
  "issues": ["issue1", "issue2"],
  "suggested_fix": "print('hello')",
  "line_by_line": {
    "1": "line 1 explanation",
    "2": "line 2 explanation"
  },
  "images": ["image_url1", "image_url2"],
  "visualization": {
    "nodes": [
      {
        "id": "1",
        "type": "function",
        "label": "Function",
        "code_snippet": "code here",
        "variables": {
          "var1": "value1"
        },
        "line": "1-5"
      }
    ],
    "edges": [
      {
        "from": "1",
        "to": "2"
      }
    ]
  }
}
`;


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

    // Ensure consistency between bugs_detected and issues
    // If there are issues detected, bugs_detected should be true
    if (Array.isArray(aiResponse.issues) && aiResponse.issues.length > 0) {
      aiResponse.bugs_detected = true;
    }
    
    // If bugs_detected is true but no issues array, create one from explanation
    if (aiResponse.bugs_detected === true && (!aiResponse.issues || aiResponse.issues.length === 0)) {
      // Extract bug information from explanation if available
      if (aiResponse.explanation) {
        const bugKeywords = ['bug', 'error', 'issue', 'problem', 'wrong', 'incorrect', 'undefined', 'not defined'];
        const hasBugKeywords = bugKeywords.some(keyword => 
          aiResponse.explanation.toLowerCase().includes(keyword)
        );
        
        if (hasBugKeywords) {
          aiResponse.issues = [aiResponse.explanation];
        } else {
          aiResponse.bugs_detected = false;
        }
      } else {
        aiResponse.bugs_detected = false;
      }
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