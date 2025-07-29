/**
 * Robust JSON parser utility for handling malformed AI responses
 */

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

// Enhanced JSON parsing with multiple fallback strategies
function parseJsonRobustly(jsonText, fallbackData = null) {
  if (!jsonText) {
    console.log('No JSON text provided, using fallback data');
    return fallbackData;
  }

  // Debug logging
  console.log('JSON text length:', jsonText.length);
  console.log('JSON text preview:', jsonText.substring(0, 200));

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
        jsonText = jsonText.replace(/,\s*}/g, '}'); // Remove trailing commas in objects
        jsonText = jsonText.replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
        jsonText = jsonText.replace(/,\s*$/g, ''); // Remove trailing commas at end
        
        // Fix common JSON syntax issues
        jsonText = jsonText.replace(/([^"\\])\s*\n\s*([^"\\])/g, '$1 $2'); // Remove newlines between properties
        jsonText = jsonText.replace(/\s+/g, ' '); // Normalize whitespace
        
        console.log('Cleaned JSON preview:', jsonText.substring(0, 300));
        
        const result = JSON.parse(jsonText);
        console.log('JSON parse successful after aggressive cleaning');
        return result;
      } catch (thirdError) {
        console.log('Third parse attempt failed:', thirdError.message);
        
        // Fourth attempt: manual extraction
        try {
          const result = extractBasicStructure(jsonText);
          if (result) {
            console.log('Manual extraction successful');
            return result;
          } else {
            throw new Error('Manual extraction failed');
          }
        } catch (extractError) {
          console.log('Manual extraction failed:', extractError.message);
          
          // Fifth attempt: try to fix common JSON issues
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
}

// Fix common JSON issues
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

// Extract basic structure from malformed JSON
function extractBasicStructure(jsonText) {
  // Try to extract common fields using regex
  const commonFields = [
    { name: 'algorithmType', pattern: /"algorithmType":\s*"([^"]+)"/ },
    { name: 'totalSteps', pattern: /"totalSteps":\s*(\d+)/ },
    { name: 'explanation', pattern: /"explanation":\s*"([^"]*(?:\\.[^"]*)*)"/ },
    { name: 'timeComplexity', pattern: /"timeComplexity":\s*"([^"]+)"/ },
    { name: 'spaceComplexity', pattern: /"spaceComplexity":\s*"([^"]+)"/ },
    { name: 'bugs_detected', pattern: /"bugs_detected":\s*(true|false)/ },
    { name: 'timeline', pattern: /"timeline":\s*\[/ },
    { name: 'steps', pattern: /"steps":\s*\[/ },
    { name: 'visualization', pattern: /"visualization":\s*\{/ },
    { name: 'nodes', pattern: /"nodes":\s*\[/ },
    { name: 'edges', pattern: /"edges":\s*\[/ },
    { name: 'issues', pattern: /"issues":\s*\[/ },
    { name: 'suggested_fix', pattern: /"suggested_fix":\s*"([^"]*(?:\\.[^"]*)*)"/ },
    { name: 'line_by_line', pattern: /"line_by_line":\s*\{/ },
    { name: 'images', pattern: /"images":\s*\[/ }
  ];

  const extractedData = {};
  
  for (const field of commonFields) {
    const match = jsonText.match(field.pattern);
    if (match) {
      if (field.name === 'bugs_detected') {
        extractedData[field.name] = match[1] === 'true';
      } else if (field.name === 'totalSteps') {
        extractedData[field.name] = parseInt(match[1]);
      } else if (field.name === 'explanation' || field.name === 'suggested_fix') {
        extractedData[field.name] = match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      } else {
        // For complex objects, just indicate they exist
        extractedData[field.name] = field.name === 'timeline' ? [] : 
                                   field.name === 'steps' ? [] :
                                   field.name === 'visualization' ? { nodes: [], edges: [] } :
                                   field.name === 'nodes' ? [] :
                                   field.name === 'edges' ? [] :
                                   field.name === 'issues' ? [] :
                                   field.name === 'line_by_line' ? {} :
                                   field.name === 'images' ? [] : true;
      }
    }
  }

  // If we extracted some data, return it
  if (Object.keys(extractedData).length > 0) {
    return extractedData;
  }

  return null;
}

// Truncate JSON if it's too large
function truncateJsonIfNeeded(jsonText, maxSize = 8000) {
  if (jsonText.length <= maxSize) {
    return jsonText;
  }

  console.log(`JSON too large (${jsonText.length} chars), truncating...`);
  
  // First, try to find a complete timeline array
  const timelineStart = jsonText.indexOf('"timeline":');
  if (timelineStart > 0) {
    const arrayStart = jsonText.indexOf('[', timelineStart);
    if (arrayStart > 0) {
      // Find the last complete step object
      const stepPattern = /},\s*{/g;
      let lastMatch = null;
      let match;
      
      while ((match = stepPattern.exec(jsonText)) !== null) {
        if (match.index < maxSize) {
          lastMatch = match;
        } else {
          break;
        }
      }
      
      if (lastMatch) {
        const truncated = jsonText.substring(0, lastMatch.index + 1) + ']';
        console.log('Truncated at complete step, length:', truncated.length);
        return truncated;
      }
    }
  }
  
  // If we can't find a good truncation point, try to close the JSON properly
  let truncated = jsonText.substring(0, maxSize);
  
  // Count brackets and braces to close them properly
  const openBraces = (truncated.match(/\{/g) || []).length;
  const closeBraces = (truncated.match(/\}/g) || []).length;
  const openBrackets = (truncated.match(/\[/g) || []).length;
  const closeBrackets = (truncated.match(/\]/g) || []).length;
  
  // Close any open brackets/braces
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    truncated += ']';
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    truncated += '}';
  }
  
  console.log('Truncated with bracket closure, length:', truncated.length);
  return truncated;
}

module.exports = {
  extractJsonFromMarkdown,
  parseJsonRobustly,
  extractBasicStructure,
  truncateJsonIfNeeded,
  fixCommonJsonIssues
}; 