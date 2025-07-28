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
  // Clean up the content - handle escaped characters
  content = content.trim();
  // Replace escaped newlines and quotes that might cause parsing issues
  content = content.replace(/\\n/g, '\n');
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\\\/g, '\\');
  // Handle control characters that break JSON parsing
  content = content.replace(/\r/g, ''); // Remove carriage returns
  content = content.replace(/\t/g, ' '); // Replace tabs with spaces
  content = content.replace(/\f/g, ''); // Remove form feeds
  content = content.replace(/\b/g, ''); // Remove backspace characters
  // Clean up any remaining problematic characters in string literals
  content = content.replace(/(?<="[^"]*)[^\x20-\x7E](?=[^"]*")/g, ' ');
  // Remove trailing commas that cause JSON parsing issues
  content = content.replace(/,(\s*[}\]])/g, '$1');
  content = content.replace(/,(\s*})/g, '$1');
  return content;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { code, language = 'javascript' } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const prompt = `Analyze the time and space complexity of the following ${language} code and provide optimization suggestions.

Code:
${code}

Requirements:
1. Analyze the time complexity (Big O notation)
2. Analyze the space complexity (Big O notation)
3. Provide a clear explanation of the complexity analysis
4. Suggest ways to optimize the code if possible
5. ALWAYS provide improved code - even if it's a basic optimization
6. Explain why the improved code is better

IMPORTANT: Always provide improved code, even if it's a simple optimization like:
- Better variable names
- More efficient loops
- Cleaner code structure
- Better error handling
- Memory optimizations
- Algorithm improvements

If the original code is already optimal, provide an alternative implementation or a different approach.

Respond with a JSON object in this exact format:
{
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)",
  "explanation": "Detailed explanation of the complexity analysis",
  "optimizationSuggestions": ["Suggestion 1", "Suggestion 2"],
  "improvedCode": "// Improved code here - ALWAYS provide this",
  "improvementExplanation": "Why the improved code is better"
}

Be helpful and educational. Always provide actual code improvements, not excuses.`;

    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [ { text: prompt } ] }
        ]
      }),
    });
    
    const data = await geminiRes.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Raw Gemini response:', content.substring(0, 500) + '...');
    
    // Extract JSON from response
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      content = codeBlockMatch[1];
    }
    const jsonMatch = content.match(/{[\s\S]*}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }
    
    // Clean JSON more aggressively
    content = content.trim()
      .replace(/\n/g, '\n')
      .replace(/\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/,\s*$/g, '')
      .replace(/}\s*$/g, '}') // Ensure proper closing
      .replace(/]\s*$/g, ']'); // Ensure proper closing
    
    console.log('Cleaned JSON:', content.substring(0, 500) + '...');
    
    let analysis;
    
    try {
      analysis = JSON.parse(content);
      console.log('JSON parse successful');
    } catch (parseError) {
      console.error('First parse attempt failed:', parseError.message);
      
      // Try to extract key fields manually
      const manualExtraction = {
        timeComplexity: extractField(content, 'timeComplexity'),
        spaceComplexity: extractField(content, 'spaceComplexity'),
        explanation: extractField(content, 'explanation'),
        optimizationSuggestions: extractArrayField(content, 'optimizationSuggestions'),
        improvedCode: extractField(content, 'improvedCode'),
        improvementExplanation: extractField(content, 'improvementExplanation')
      };
      
      console.log('Manual extraction result:', manualExtraction);
      
      // Validate that we have at least some data
      if (manualExtraction.timeComplexity || manualExtraction.spaceComplexity) {
        analysis = manualExtraction;
        console.log('Manual extraction successful');
      } else {
        throw new Error('Unable to extract any meaningful data from response');
      }
    }
    
    // Validate and provide defaults
    const validatedAnalysis = {
      timeComplexity: analysis.timeComplexity || 'O(n)',
      spaceComplexity: analysis.spaceComplexity || 'O(1)',
      explanation: analysis.explanation || 'Complexity analysis not available.',
      optimizationSuggestions: analysis.optimizationSuggestions || [],
      improvedCode: analysis.improvedCode || generateFallbackCode(code, language),
      improvementExplanation: analysis.improvementExplanation || 'Basic code improvements applied for better readability and maintainability.'
    };
    
    return res.status(200).json(validatedAnalysis);
    
  } catch (e) {
    console.error('Error in complexity analysis:', e);
    return res.status(500).json({ 
      error: e.message,
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(1)',
      explanation: 'Unable to analyze complexity. Please try with simpler code.',
      optimizationSuggestions: [],
      improvedCode: generateFallbackCode(code, language),
      improvementExplanation: 'Basic code improvements applied for better readability and maintainability.'
    });
  }
}

// Helper function to extract field values from malformed JSON
function extractField(content, fieldName) {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i');
  const match = content.match(regex);
  return match ? match[1] : null;
}

// Helper function to extract array fields from malformed JSON
function extractArrayField(content, fieldName) {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
  const match = content.match(regex);
  if (match) {
    // Extract individual items from the array
    const items = match[1].match(/"([^"]*)"/g);
    return items ? items.map(item => item.replace(/"/g, '')) : [];
  }
  return [];
} 

// Helper function to generate fallback improved code
function generateFallbackCode(originalCode, language) {
  if (!originalCode) return '// No code provided';
  
  // Basic improvements that can be applied to most code
  let improvedCode = originalCode;
  
  // Add comments if none exist
  if (!improvedCode.includes('//') && !improvedCode.includes('/*')) {
    improvedCode = `// Improved version with better structure\n${improvedCode}`;
  }
  
  // Add basic error handling for functions
  if (improvedCode.includes('function') && !improvedCode.includes('try')) {
    improvedCode = improvedCode.replace(
      /function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
      'function $1($2) {\n  try {'
    );
    improvedCode = improvedCode.replace(
      /}\s*$/g,
      '  } catch (error) {\n    console.error("Error:", error);\n    throw error;\n  }\n}'
    );
  }
  
  // Add input validation for functions
  if (improvedCode.includes('function') && improvedCode.includes('(')) {
    improvedCode = improvedCode.replace(
      /function\s+(\w+)\s*\(([^)]*)\)\s*{/g,
      (match, funcName, params) => {
        const paramList = params.split(',').map(p => p.trim()).filter(p => p);
        const validations = paramList.map(param => 
          `  if (${param} === undefined || ${param} === null) {\n    throw new Error("${param} is required");\n  }`
        ).join('\n');
        return `function ${funcName}(${params}) {\n${validations}\n`;
      }
    );
  }
  
  return improvedCode;
} 