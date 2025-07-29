// Test file to verify bug detection logic
// This tests the scenario from the image where print(hello) has an undefined variable

const testBugDetection = async () => {
  const testCode = `print(hello)`;
  
  console.log('Testing bug detection with code:', testCode);
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code: testCode, 
        language: 'python',
        level: 'beginner'
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('API Error:', error);
      return;
    }
    
    const data = await response.json();
    console.log('\n=== API Response ===');
    console.log('bugs_detected:', data.bugs_detected);
    console.log('issues:', data.issues);
    console.log('explanation:', data.explanation);
    console.log('suggested_fix:', data.suggested_fix);
    
    // Verify the logic works correctly
    const hasBugs = data.bugs_detected || (data.issues && data.issues.length > 0);
    console.log('\n=== Bug Detection Logic ===');
    console.log('bugs_detected field:', data.bugs_detected);
    console.log('issues array length:', data.issues ? data.issues.length : 0);
    console.log('Has bugs detected:', hasBugs);
    
    if (hasBugs) {
      console.log('✅ Bug detection working correctly');
    } else {
      console.log('❌ Bug detection failed - should have detected undefined variable');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testBugDetection(); 