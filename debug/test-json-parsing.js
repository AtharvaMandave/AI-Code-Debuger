// Test script to verify improved JSON parsing
const fs = require('fs');
const path = require('path');

// Mock the JSON parser functions for testing
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
  content = content.replace(/\\n/g, '\n');
  content = content.replace(/\\"/g, '"');
  content = content.replace(/\\\\/g, '\\');
  content = content.replace(/\r/g, '');
  content = content.replace(/\t/g, ' ');
  content = content.replace(/\f/g, '');
  content = content.replace(/\b/g, '');
  content = content.replace(/(?<="[^"]*)[^\x20-\x7E](?=[^"]*")/g, ' ');
  content = content.replace(/,(\s*[}\]])/g, '$1');
  content = content.replace(/,(\s*})/g, '$1');
  
  return content;
}

function fixCommonJsonIssues(jsonText) {
  let fixed = jsonText;
  
  // Fix unescaped quotes in strings
  fixed = fixed.replace(/"([^"]*)"([^"]*)"([^"]*)"/g, '"$1\\"$2\\"$3"');
  
  // Fix missing quotes around property names
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Fix single quotes to double quotes
  fixed = fixed.replace(/'/g, '"');
  
  // Fix trailing commas
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix missing commas between properties
  fixed = fixed.replace(/}(\s*){/g, '},$1{');
  fixed = fixed.replace(/](\s*)\[/g, '],$1[');
  
  return fixed;
}

function parseJsonRobustly(jsonText, fallbackData = null) {
  if (!jsonText) {
    console.log('No JSON text provided, using fallback data');
    return fallbackData;
  }

  // First attempt: direct parsing
  try {
    const result = JSON.parse(jsonText);
    console.log('JSON parse successful on first attempt');
    return result;
  } catch (parseError) {
    console.log('Initial JSON parse failed, attempting to clean...');
    
    // Second attempt: remove control characters
    try {
      let cleanedJson = jsonText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      const result = JSON.parse(cleanedJson);
      console.log('JSON parse successful after cleaning control characters');
      return result;
    } catch (secondError) {
      console.log('Second parse attempt failed:', secondError.message);
      
      // Third attempt: more aggressive cleaning
      try {
        // Remove any text before the first {
        const firstBrace = jsonText.indexOf('{');
        if (firstBrace > 0) {
          jsonText = jsonText.substring(firstBrace);
        }
        
        // Remove any text after the last }
        const lastBrace = jsonText.lastIndexOf('}');
        if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
          jsonText = jsonText.substring(0, lastBrace + 1);
        }
        
        // Additional cleaning for common issues
        jsonText = jsonText.replace(/,\s*}/g, '}');
        jsonText = jsonText.replace(/,\s*]/g, ']');
        jsonText = jsonText.replace(/,\s*$/g, '');
        jsonText = jsonText.replace(/([^"\\])\s*\n\s*([^"\\])/g, '$1 $2');
        jsonText = jsonText.replace(/\s+/g, ' ');
        
        console.log('Cleaned JSON preview:', jsonText.substring(0, 300));
        
        const result = JSON.parse(jsonText);
        console.log('JSON parse successful after aggressive cleaning');
        return result;
      } catch (thirdError) {
        console.log('Third parse attempt failed:', thirdError.message);
        
        // Fourth attempt: try to fix common JSON issues
        try {
          const fixedJson = fixCommonJsonIssues(jsonText);
          const result = JSON.parse(fixedJson);
          console.log('JSON parse successful after fixing common issues');
          return result;
        } catch (fixError) {
          console.log('Fix attempt failed:', fixError.message);
          
          // Final fallback
          console.log('Using fallback data');
          return fallbackData;
        }
      }
    }
  }
}

console.log('Testing improved JSON parsing...\n');

// Test cases with malformed JSON
const testCases = [
  {
    name: 'Control characters in JSON',
    input: '{"explanation": "This has\n\t\r\f\b control chars", "bugs_detected": true}',
    expected: { explanation: 'This has control chars', bugs_detected: true }
  },
  {
    name: 'Trailing commas',
    input: '{"explanation": "test", "bugs_detected": true,}',
    expected: { explanation: 'test', bugs_detected: true }
  },
  {
    name: 'Unescaped quotes in strings',
    input: '{"explanation": "This has "quotes" inside", "bugs_detected": true}',
    expected: { explanation: 'This has "quotes" inside', bugs_detected: true }
  },
  {
    name: 'Missing quotes around property names',
    input: '{explanation: "test", bugs_detected: true}',
    expected: { explanation: 'test', bugs_detected: true }
  },
  {
    name: 'Single quotes instead of double quotes',
    input: "{'explanation': 'test', 'bugs_detected': true}",
    expected: { explanation: 'test', bugs_detected: true }
  },
  {
    name: 'Markdown code block',
    input: '```json\n{"explanation": "test", "bugs_detected": true}\n```',
    expected: { explanation: 'test', bugs_detected: true }
  },
  {
    name: 'Completely malformed JSON',
    input: 'This is not JSON at all',
    expected: null // Should use fallback
  }
];

const fallbackData = {
  explanation: "Unable to parse full response due to JSON formatting issues.",
  bugs_detected: false,
  issues: ["JSON parsing failed"],
  suggested_fix: "Try using the Step Debugger feature for more reliable analysis.",
  line_by_line: {},
  images: [],
  visualization: { nodes: [], edges: [] }
};

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input: ${testCase.input.substring(0, 50)}...`);
  
  try {
    const result = parseJsonRobustly(testCase.input, fallbackData);
    
    if (testCase.expected === null) {
      // For malformed JSON, should return fallback
      if (result === fallbackData) {
        console.log('✅ PASS: Returned fallback data for malformed JSON');
      } else {
        console.log('❌ FAIL: Expected fallback data but got:', result);
      }
    } else {
      // For fixable JSON, should return parsed data
      if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
        console.log('✅ PASS: Successfully parsed malformed JSON');
      } else {
        console.log('❌ FAIL: Expected:', testCase.expected);
        console.log('     Got:', result);
      }
    }
  } catch (error) {
    console.log('❌ FAIL: Unexpected error:', error.message);
  }
  
  console.log('');
});

console.log('JSON parsing test completed!');
console.log('\nTo test the full system:');
console.log('1. Start the development server: npm run dev');
console.log('2. Go to the debug page');
console.log('3. Paste your merge sort code');
console.log('4. Click "Step Debugger"');
console.log('5. Verify that bounds checking warnings appear');
console.log('6. Check that no JSON parsing errors occur'); 