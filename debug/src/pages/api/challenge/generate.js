import dbConnect from '../../../lib/db';
const Challenge = require('../../../models/Challenge');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  await dbConnect();
  
  const { language = 'javascript' } = req.body;
  
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
4. For fix-bug: Include a subtle but realistic bug
5. For output-predictor: Create code that produces a specific output
6. For refactor-rush: Create inefficient code that can be optimized
7. Make it appropriate for ${difficulty} difficulty level

Respond with a JSON object in this exact format:
{
  "title": "Challenge Title",
  "description": "Clear problem description",
  "starterCode": "Code with bug/inefficiency or code to analyze",
  "solution": "Correct solution or expected output",
  "mode": "${challengeType.mode}",
  "difficulty": "${difficulty}",
  "language": "${language}",
  "tags": ["${difficulty}", "${language}", "relevant-tag"]
}

Only return the JSON object, nothing else.`;

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
            throw new Error('Missing required fields');
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
          // Create a fallback challenge
          const fallbackChallenge = await Challenge.create({
            title: `${challengeType.mode.replace('-', ' ').toUpperCase()} - ${difficulty}`,
            description: `A ${difficulty} level ${challengeType.mode.replace('-', ' ')} challenge in ${language}.`,
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
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return res.status(200).json({ 
      message: 'Challenges generated successfully!', 
      count: generatedChallenges.length,
      weekNumber: getCurrentWeekNumber()
    });
    
  } catch (e) {
    console.error('Error generating challenges:', e);
    return res.status(500).json({ error: e.message });
  }
}

function getCurrentWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function getFallbackCode(mode, difficulty, language) {
  const codes = {
    'fix-bug': {
      javascript: 'function bubbleSort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] < arr[j + 1]) { // BUG: should be >\n        let temp = arr[j];\n        arr[j] = arr[j + 1];\n        arr[j + 1] = temp;\n      }\n    }\n  }\n  return arr;\n}',
      python: 'def bubble_sort(arr):\n    for i in range(len(arr)):\n        for j in range(len(arr) - i - 1):\n            if arr[j] < arr[j + 1]:  # BUG: should be >\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n    return arr',
      java: 'public class BubbleSort {\n    public static void bubbleSort(int[] arr) {\n        for (int i = 0; i < arr.length; i++) {\n            for (int j = 0; j < arr.length - i - 1; j++) {\n                if (arr[j] < arr[j + 1]) { // BUG: should be >\n                    int temp = arr[j];\n                    arr[j] = arr[j + 1];\n                    arr[j + 1] = temp;\n                }\n            }\n        }\n    }\n}',
      cpp: '#include <vector>\nusing namespace std;\n\nvoid bubbleSort(vector<int>& arr) {\n    for (int i = 0; i < arr.size(); i++) {\n        for (int j = 0; j < arr.size() - i - 1; j++) {\n            if (arr[j] < arr[j + 1]) { // BUG: should be >\n                swap(arr[j], arr[j + 1]);\n            }\n        }\n    }\n}'
    },
    'output-predictor': {
      javascript: 'const arr = [1,2,3];\nconst result = arr.map(x => x * 2);\nconsole.log(result);',
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