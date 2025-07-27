import { extractJsonFromMarkdown, parseJsonRobustly, truncateJsonIfNeeded } from '../../lib/json-parser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, language } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  const prompt = `You are an AI algorithm debugger with expertise in detecting logical errors and bounds checking. Analyze the given code step-by-step and return ONLY a valid JSON object.

CRITICAL: Return ONLY the JSON object. No explanations, no markdown, no code blocks.

IMPORTANT REQUIREMENTS:
- Generate maximum 10 steps (not 20!)
- Keep each step description very brief
- Focus on the most important steps only
- Ensure valid JSON syntax with no trailing commas
- ALWAYS check for index out of bounds conditions
- Detect array/string access beyond valid indices
- Check for division by zero, null pointer access
- Validate loop conditions and termination
- Identify potential infinite loops
- Check for proper variable initialization

SPECIFIC BUGS TO DETECT:
- Loop conditions using <= instead of < (causes index out of bounds)
- Array access with index equal to array length
- Infinite loops due to incorrect termination conditions
- Incorrect array slicing (e.g., arr[i+1:] instead of arr[i:])
- Missing bounds checks before array access

For the code below, create a step-by-step analysis with this exact JSON structure:

{
  "algorithmType": "algorithm_name",
  "totalSteps": number_of_steps,
  "steps": [
    {
      "stepIndex": 0,
      "stepType": "operation_type",
      "description": "Brief description",
      "lineNumber": line_number,
      "variables": {
        "var1": "value1"
      },
      "highlightedLines": [line_numbers],
      "boundsCheck": {
        "isValid": true/false,
        "issue": "description of bounds issue if any",
        "suggestion": "how to fix the bounds issue"
      }
    }
  ]
}

CRITICAL BOUNDS CHECKING LOGIC:
- For arrays: Check if index >= 0 AND index < array.length
- For strings: Check if index >= 0 AND index < string.length  
- For loops: Verify loop conditions prevent infinite execution
- For function calls: Check if parameters are within valid ranges
- For mathematical operations: Check for division by zero, overflow
- For merge sort specifically: Check while loop conditions and array access

Example for merge sort bounds checking:
{
  "algorithmType": "merge_sort",
  "totalSteps": 4,
  "steps": [
    {
      "stepIndex": 0,
      "stepType": "loop_condition",
      "description": "Check while loop condition",
      "lineNumber": 15,
      "variables": {
        "i": 0,
        "j": 0,
        "leftLength": 3,
        "rightLength": 4
      },
      "highlightedLines": [15],
      "boundsCheck": {
        "isValid": false,
        "issue": "Loop condition 'i <= len(left)' allows i to reach len(left), causing index out of bounds when accessing left[i]",
        "suggestion": "Change 'i <= len(left)' to 'i < len(left)' to prevent accessing beyond array bounds"
      }
    },
    {
      "stepIndex": 1,
      "stepType": "array_access",
      "description": "Access left[i] when i equals array length",
      "lineNumber": 16,
      "variables": {
        "i": 3,
        "left": [1, 2, 3],
        "leftLength": 3
      },
      "highlightedLines": [16],
      "boundsCheck": {
        "isValid": false,
        "issue": "Accessing left[3] when left has length 3 (indices 0,1,2) causes IndexError",
        "suggestion": "Ensure i < len(left) before accessing left[i]"
      }
    }
  ]
}

Code to analyze:
${code}

Language: ${language}

IMPORTANT: Always include boundsCheck for each step. If no bounds issues exist, set isValid: true and issue/suggestion to null.

Return ONLY the JSON object, nothing else. Keep it under 10 steps maximum.`;

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
    
    // Parse JSON using robust parser
    const fallbackData = {
      algorithmType: "unknown",
      totalSteps: 1,
      steps: [
        {
          stepIndex: 0,
          stepType: "execute",
          description: "Code analysis completed. The algorithm is too complex for detailed step-by-step debugging. Try using a simpler algorithm or the regular 'Debug' feature for code analysis.",
          variables: {},
          highlightedLines: [],
          boundsCheck: {
            isValid: true,
            issue: null,
            suggestion: null
          }
        }
      ]
    };
    
    let debugSteps = parseJsonRobustly(jsonText, fallbackData);

    // Validate the structure
    if (!debugSteps || typeof debugSteps !== 'object') {
      throw new Error('Invalid debug steps structure');
    }
    
    if (!Array.isArray(debugSteps.steps)) {
      debugSteps.steps = [];
    }

    // Limit the number of steps to prevent UI issues
    const MAX_STEPS = 10;
    if (debugSteps.steps.length > MAX_STEPS) {
      console.log(`Too many steps (${debugSteps.steps.length}), limiting to ${MAX_STEPS}`);
      debugSteps.steps = debugSteps.steps.slice(0, MAX_STEPS);
      debugSteps.totalSteps = MAX_STEPS;
    }

    // Ensure all steps have required fields including boundsCheck
    debugSteps.steps = debugSteps.steps.map((step, index) => ({
      stepIndex: index,
      stepType: step.stepType || 'execute',
      description: step.description || `Step ${index + 1}`,
      lineNumber: step.lineNumber || null,
      variables: step.variables || {},
      highlightedLines: step.highlightedLines || [],
      boundsCheck: step.boundsCheck || {
        isValid: true,
        issue: null,
        suggestion: null
      }
    }));

    return res.status(200).json(debugSteps);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
} 