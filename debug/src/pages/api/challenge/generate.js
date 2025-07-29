import dbConnect from '../../../lib/db';
const Challenge = require('../../../models/Challenge');

// Helper functions defined at the top
function getCurrentWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function getFallbackCode(mode, difficulty, language) {
  const codes = {
    'fix-bug': {
      javascript: 'function bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] < arr[j + 1]) {\n        let temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n  return arr;\n}',
      python: 'def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr) - i - 1):\n            if arr[j] < arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr',
      java: 'public class BubbleSort {\n    public static void bubbleSort(int[] arr) {\n        for (int i = 0; i < arr.length; i++) {\n            for (int j = 0; j < arr.length - i - 1; j++) {\n                if (arr[j] < arr[j + 1]) {\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n}',
      cpp: '#include <vector>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr) {\n    for (int i = 0; i < arr.size(); i++) {\n        for (int j = 0; j < arr.size() - i - 1; j++) {\n            if (arr[j] < arr[j + 1]) {\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}'
    },
    'output-predictor': {
      javascript: '// No starter code needed for output-predictor mode\n// Code to analyze is in the description',
      python: '# No starter code needed for output-predictor mode\n# Code to analyze is in the description',
      java: '// No starter code needed for output-predictor mode\n// Code to analyze is in the description',
      cpp: '// No starter code needed for output-predictor mode\n// Code to analyze is in the description'
    },
    'refactor-rush': {
      javascript: 'function removeDuplicates(arr) {\n  let result = [];\n  for (let i = 0; i < arr.length; i++) {\n    if (result.indexOf(arr[i]) === -1) {\n      result.push(arr[i]);\n    }\n  }\n  return result;\n}',
      python: 'def remove_duplicates(arr):\n    result = []\n    for item in arr:\n        if item not in result:\n            result.append(item)\n    return result',
      java: 'public static List<Integer> removeDuplicates(List<Integer> arr) {\n    List<Integer> result = new ArrayList<>();\n    for (Integer item : arr) {\n        if (!result.contains(item)) {\n            result.add(item);\n        }\n    }\n    return result;\n}',
      cpp: 'vector<int> removeDuplicates(vector<int>& arr) {\n    vector<int> result;\n    for (int item : arr) {\n        if (find(result.begin(), result.end(), item) == result.end()) {\n            result.push_back(item);\n        }\n    }\n    return result;\n}'
    }
  };
  return codes[mode]?.[language] || codes[mode]?.javascript || '// Fallback code';
}

function getFallbackCodeForDescription(mode, difficulty, language) {
  const codes = {
    'fix-bug': {
      javascript: 'function bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] < arr[j + 1]) {\n        let temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n  return arr;\n}',
      python: 'def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr) - i - 1):\n            if arr[j] < arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr',
      java: 'public class BubbleSort {\n    public static void bubbleSort(int[] arr) {\n        for (int i = 0; i < arr.length; i++) {\n            for (int j = 0; j < arr.length - i - 1; j++) {\n                if (arr[j] < arr[j + 1]) {\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n}',
      cpp: '#include <vector>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr) {\n    for (int i = 0; i < arr.size(); i++) {\n        for (int j = 0; j < arr.size() - i - 1; j++) {\n            if (arr[j] < arr[j + 1]) {\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}'
    },
    'output-predictor': {
      javascript: 'const arr = [1, 2, 3];\nconst result = arr.map(x => x * 2);\nconsole.log(result);',
      python: 'arr = [1, 2, 3]\nresult = [x * 2 for x in arr]\nprint(result)',
      java: 'int[] arr = {1, 2, 3};\nint[] result = Arrays.stream(arr).map(x -> x * 2).toArray();\nSystem.out.println(Arrays.toString(result));',
      cpp: 'vector<int> arr = {1, 2, 3};\nvector<int> result;\nfor (int x : arr) {\n    result.push_back(x * 2);\n}\nfor (int x : result) {\n    cout << x << " ";\n}'
    },
    'refactor-rush': {
      javascript: 'function removeDuplicates(arr) {\n  let result = [];\n  for (let i = 0; i < arr.length; i++) {\n    if (result.indexOf(arr[i]) === -1) {\n      result.push(arr[i]);\n    }\n  }\n  return result;\n}',
      python: 'def remove_duplicates(arr):\n    result = []\n    for item in arr:\n        if item not in result:\n            result.append(item)\n    return result',
      java: 'public static List<Integer> removeDuplicates(List<Integer> arr) {\n    List<Integer> result = new ArrayList<>();\n    for (Integer item : arr) {\n        if (!result.contains(item)) {\n            result.add(item);\n        }\n    }\n    return result;\n}',
      cpp: 'vector<int> removeDuplicates(vector<int>& arr) {\n    vector<int> result;\n    for (int item : arr) {\n        if (find(result.begin(), result.end(), item) == result.end()) {\n            result.push_back(item);\n        }\n    }\n    return result;\n}'
    }
  };
  return codes[mode]?.[language] || codes[mode]?.javascript || '// Fallback code';
}

function getFallbackSolution(mode, difficulty, language) {
  const solutions = {
    'fix-bug': {
      javascript: 'function bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        let temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n  return arr;\n}',
      python: 'def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr) - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr',
      java: 'public class BubbleSort {\n    public static void bubbleSort(int[] arr) {\n        for (int i = 0; i < arr.length; i++) {\n            for (int j = 0; j < arr.length - i - 1; j++) {\n                if (arr[j] > arr[j + 1]) {\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n}',
      cpp: '#include <vector>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr) {\n    for (int i = 0; i < arr.size(); i++) {\n        for (int j = 0; j < arr.size() - i - 1; j++) {\n            if (arr[j] > arr[j + 1]) {\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}'
    },
    'output-predictor': {
      javascript: '[2,4,6]',
      python: '[2, 4, 6]',
      java: '[2, 4, 6]',
      cpp: '2 4 6'
    },
    'refactor-rush': {
      javascript: 'function removeDuplicates(arr) {\n  return [...new Set(arr)];\n}',
      python: 'def remove_duplicates(arr):\n    return list(set(arr))',
      java: 'public static List<Integer> removeDuplicates(List<Integer> arr) {\n    return new ArrayList<>(new LinkedHashSet<>(arr));\n}',
      cpp: 'vector<int> removeDuplicates(vector<int>& arr) {\n    unordered_set<int> seen;\n    vector<int> result;\n    for (int item : arr) {\n        if (seen.insert(item).second) {\n            result.push_back(item);\n        }\n    }\n    return result;\n}'
    }
  };
  return solutions[mode]?.[language] || solutions[mode]?.javascript || '// Fallback solution';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed' });
  }
  
  const { language = 'javascript' } = req.body;
  
  // Validate language
  const validLanguages = ['javascript', 'python', 'java', 'cpp'];
  if (!validLanguages.includes(language)) {
    return res.status(400).json({ error: 'Invalid language specified' });
  }
  
  const challengeTypes = [
    { mode: 'fix-bug', count: 3 },
    { mode: 'output-predictor', count: 3 },
    { mode: 'refactor-rush', count: 3 }
  ];
  
  const difficulties = ['easy', 'medium', 'hard'];
  
  try {
    // Clear existing challenges
    await Challenge.deleteMany({});
    
    const generatedChallenges = [];
    let apiErrors = 0;
    const maxApiErrors = 3;
    
    for (const challengeType of challengeTypes) {
      for (let i = 0; i < challengeType.count; i++) {
        const difficulty = difficulties[i];
        
        const prompt = `Generate a coding challenge for ${language} with the following specifications:

Mode: ${challengeType.mode}
Difficulty: ${difficulty}
Language: ${language}

Requirements:
1. Create a realistic, practical coding problem
2. Include a clear title, description, and starter code
3. Provide the correct solution
4. For fix-bug: Include a subtle but realistic bug in the starter code that users need to identify and fix. DO NOT include obvious comments like "BUG:" or "FIX:" - make the bug subtle and realistic
5. For output-predictor: Create code that produces a specific output - INCLUDE THE CODE IN THE DESCRIPTION, NOT IN STARTER CODE
6. For refactor-rush: Create inefficient code that can be optimized for better performance
7. Make it appropriate for ${difficulty} difficulty level

IMPORTANT: 
- For output-predictor mode: The description MUST include the actual code snippet that users need to analyze. The starterCode should be empty or minimal.
- For fix-bug mode: The starterCode should contain the buggy code that users need to fix. The bug should be subtle and realistic, not obvious.
- For refactor-rush mode: The starterCode should contain the inefficient code that users need to optimize.

Respond with a JSON object in this exact format:
{
  "title": "Challenge Title",
  "description": "Clear problem description WITH CODE SNIPPET if output-predictor",
  "starterCode": "Code with bug/inefficiency (for fix-bug/refactor-rush) or minimal code (for output-predictor)",
  "solution": "Correct solution or expected output",
  "mode": "${challengeType.mode}",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "tags": ["${difficulty}", "${language}", "relevant-tag"]
}

Only return the JSON object, nothing else.`;

        try {
          const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + process.env.GEMINI_API_KEY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                { parts: [ { text: prompt } ] }
              ]
            }),
          });
          
          if (!geminiRes.ok) {
            throw new Error(`Gemini API error: ${geminiRes.status}`);
          }
          
          const data = await geminiRes.json();
          let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (!content) {
            throw new Error('Empty response from Gemini API');
          }
          
          // Extract JSON from response
          const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
          if (codeBlockMatch) {
            content = codeBlockMatch[1];
          }
          const jsonMatch = content.match(/{[\s\S]*}/);
          if (jsonMatch) {
            content = jsonMatch[0];
          }
          
          // Clean JSON
          content = content.trim()
            .replace(/\n/g, '\n')
            .replace(/\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/,\s*$/g, '');
          
          try {
            const challenge = JSON.parse(content);
            
            // Validate required fields
            if (!challenge.title || !challenge.description || !challenge.starterCode || !challenge.solution) {
              throw new Error('Missing required fields in AI response');
            }
            
            // Validate challenge mode
            if (challenge.mode !== challengeType.mode) {
              challenge.mode = challengeType.mode;
            }
            
            // Validate difficulty
            if (!difficulties.includes(challenge.difficulty)) {
              challenge.difficulty = difficulty;
            }
            
            // Validate language
            if (challenge.language !== language) {
              challenge.language = language;
            }
            
            // Add to database
            const savedChallenge = await Challenge.create({
              ...challenge,
              createdAt: new Date(),
              weekNumber: getCurrentWeekNumber()
            });
            
            generatedChallenges.push(savedChallenge);
            console.log(`Generated ${challenge.mode} ${challenge.difficulty} challenge for ${language}`);
            
          } catch (parseError) {
            console.error('Failed to parse challenge:', parseError);
            apiErrors++;
            
            // Create a fallback challenge
            const fallbackDescription = challengeType.mode === 'output-predictor' 
              ? `What will be the output of the following ${language} code?\n\n${getFallbackCodeForDescription(challengeType.mode, difficulty, language)}`
              : `A ${difficulty} level ${challengeType.mode.replace('-', ' ')} challenge in ${language}.`;
              
            const fallbackChallenge = await Challenge.create({
              title: `${challengeType.mode.replace('-', ' ').toUpperCase()} - ${difficulty}`,
              description: fallbackDescription,
              starterCode: getFallbackCode(challengeType.mode, difficulty, language),
              solution: getFallbackSolution(challengeType.mode, difficulty, language),
              mode: challengeType.mode,
              difficulty: difficulty,
              language: language,
              tags: [difficulty, language, 'fallback'],
              createdAt: new Date(),
              weekNumber: getCurrentWeekNumber()
            });
            generatedChallenges.push(fallbackChallenge);
          }
          
        } catch (apiError) {
          console.error('API error for challenge generation:', apiError);
          apiErrors++;
          
          if (apiErrors >= maxApiErrors) {
            console.error('Too many API errors, stopping generation');
            break;
          }
          
          // Create fallback challenge
          const fallbackDescription = challengeType.mode === 'output-predictor' 
            ? `What will be the output of the following ${language} code?\n\n${getFallbackCodeForDescription(challengeType.mode, difficulty, language)}`
            : `A ${difficulty} level ${challengeType.mode.replace('-', ' ')} challenge in ${language}.`;
            
          const fallbackChallenge = await Challenge.create({
            title: `${challengeType.mode.replace('-', ' ').toUpperCase()} - ${difficulty}`,
            description: fallbackDescription,
            starterCode: getFallbackCode(challengeType.mode, difficulty, language),
            solution: getFallbackSolution(challengeType.mode, difficulty, language),
            mode: challengeType.mode,
            difficulty: difficulty,
            language: language,
            tags: [difficulty, language, 'fallback'],
            createdAt: new Date(),
            weekNumber: getCurrentWeekNumber()
          });
          generatedChallenges.push(fallbackChallenge);
        }
        
        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return res.status(200).json({ 
      message: 'Challenges generated successfully!', 
      count: generatedChallenges.length,
      weekNumber: getCurrentWeekNumber(),
      apiErrors: apiErrors
    });
    
  } catch (e) {
    console.error('Error generating challenges:', e);
    return res.status(500).json({ error: e.message });
  }
} 