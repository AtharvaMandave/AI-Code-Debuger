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
- Generate up to 50 steps (not just 10 or 30)
- Cover every significant step, loop iteration, variable update, and key operation
- Do not skip steps. Cover every step of the algorithm.
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

Return ONLY the JSON object, nothing else. You may return up to 50 steps maximum.`;

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
    console.log('Raw Gemini response length:', content.length);
    console.log('Raw Gemini response preview:', content.substring(0, 500));

    // Extract JSON using shared utility
    let jsonText = extractJsonFromMarkdown(content);
    console.log('Extracted JSON text length:', jsonText.length);
    console.log('Extracted JSON preview:', jsonText.substring(0, 500));

    // Truncate if too large
    jsonText = truncateJsonIfNeeded(jsonText, 60000); // allow larger JSON
    console.log('Truncated JSON text length:', jsonText.length);

    // Try robust parsing
    let debugSteps = parseJsonRobustly(jsonText, null);

    // If robust parsing fails, try aggressive cleaning
    if (!debugSteps) {
      try {
        let cleaned = jsonText
          .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
          .replace(/\s+\}/g, '}')
          .replace(/\s+\]/g, ']')
          .replace(/\n/g, '\n')
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
          .replace(/\"/g, '"')
          .replace(/\\\\/g, '\\');
        debugSteps = JSON.parse(cleaned);
        console.log('Aggressive cleaning parse successful');
      } catch (e) {
        console.error('Aggressive cleaning parse failed:', e.message);
      }
    }

    // If still no result, try manual extraction of steps array
    if (!debugSteps) {
      try {
        const stepsMatch = jsonText.match(/"steps"\s*:\s*\[(.*)\][^\]]*$/s);
        if (stepsMatch) {
          const stepsArrayText = stepsMatch[1];
          const stepRegex = /\{[^\{\}]*\}/g;
          const steps = [];
          let match;
          while ((match = stepRegex.exec(stepsArrayText)) !== null) {
            try {
              const step = JSON.parse(match[0]
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/\s+\}/g, '}')
                .replace(/\s+\]/g, ']')
                .replace(/\n/g, '\n')
                .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                .replace(/\"/g, '"')
                .replace(/\\\\/g, '\\')
              );
              steps.push(step);
            } catch (e) {
              console.error('Manual step parse failed:', e.message);
            }
          }
          debugSteps = {
            algorithmType: 'unknown',
            totalSteps: steps.length,
            steps
          };
          console.log('Manual extraction successful, steps:', steps.length);
        }
      } catch (e) {
        console.error('Manual extraction failed:', e.message);
      }
    }

    // Fallback if still nothing
    if (!debugSteps || !Array.isArray(debugSteps.steps) || debugSteps.steps.length === 0) {
      debugSteps = {
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
      console.log('Fallback: returning single generic step');
    }

    // Limit the number of steps to prevent UI issues
    const MAX_STEPS = 50;
    if (debugSteps.steps.length > MAX_STEPS) {
      console.log(`Too many steps (${debugSteps.steps.length}), limiting to ${MAX_STEPS}`);
      debugSteps.steps = debugSteps.steps.slice(0, MAX_STEPS);
      debugSteps.totalSteps = MAX_STEPS;
    } else {
      debugSteps.totalSteps = debugSteps.steps.length;
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