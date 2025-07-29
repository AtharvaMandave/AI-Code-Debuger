// Test file to verify the consistency logic in analyze API
// This tests the logic that ensures bugs_detected and issues are consistent

const testConsistencyLogic = () => {
  console.log('Testing consistency logic...\n');
  
  // Test cases
  const testCases = [
    {
      name: 'Case 1: bugs_detected false, issues empty (should stay false)',
      input: { bugs_detected: false, issues: [] },
      expected: { bugs_detected: false, issues: [] }
    },
    {
      name: 'Case 2: bugs_detected false, issues has items (should become true)',
      input: { bugs_detected: false, issues: ['Undefined variable hello'] },
      expected: { bugs_detected: true, issues: ['Undefined variable hello'] }
    },
    {
      name: 'Case 3: bugs_detected true, issues empty, explanation has bug keywords (should add issue)',
      input: { 
        bugs_detected: true, 
        issues: [], 
        explanation: 'The code has a bug: undefined variable hello' 
      },
      expected: { bugs_detected: true, issues: ['The code has a bug: undefined variable hello'] }
    },
    {
      name: 'Case 4: bugs_detected true, issues empty, explanation has no bug keywords (should become false)',
      input: { 
        bugs_detected: true, 
        issues: [], 
        explanation: 'This code works perfectly' 
      },
      expected: { bugs_detected: false, issues: [] }
    }
  ];
  
  // Simulate the consistency logic
  const applyConsistencyLogic = (aiResponse) => {
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
    
    return aiResponse;
  };
  
  // Run tests
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log('Input:', testCase.input);
    
    const result = applyConsistencyLogic({ ...testCase.input });
    console.log('Output:', result);
    
    const bugsMatch = result.bugs_detected === testCase.expected.bugs_detected;
    const issuesMatch = JSON.stringify(result.issues) === JSON.stringify(testCase.expected.issues);
    
    if (bugsMatch && issuesMatch) {
      console.log('✅ PASS\n');
    } else {
      console.log('❌ FAIL');
      console.log('Expected bugs_detected:', testCase.expected.bugs_detected, 'Got:', result.bugs_detected);
      console.log('Expected issues:', testCase.expected.issues, 'Got:', result.issues);
      console.log('');
    }
  });
};

// Run the consistency test
testConsistencyLogic(); 