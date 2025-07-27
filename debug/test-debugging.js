// Test file to demonstrate improved debugging functionality
// This file shows examples of code with bounds issues that the debugger should detect

// Example 1: Array access with potential out of bounds
function testArrayBounds() {
  const arr = [1, 2, 3, 4, 5];
  let sum = 0;
  
  // This loop has a bounds issue - it will try to access arr[5] which is out of bounds
  for (let i = 0; i <= arr.length; i++) {
    sum += arr[i]; // BUG: arr[5] is undefined
  }
  
  return sum;
}

// Example 2: String access with bounds checking
function testStringBounds(str) {
  let result = '';
  
  // This loop correctly checks bounds
  for (let i = 0; i < str.length; i++) {
    result += str[i];
  }
  
  // This would cause an out of bounds error
  // result += str[str.length]; // BUG: accessing beyond string length
  
  return result;
}

// Example 3: Division by zero check
function testDivisionByZero(a, b) {
  // Missing bounds check for division by zero
  return a / b; // BUG: if b is 0, this will cause an error
}

// Example 4: Proper bounds checking
function testProperBounds(arr, index) {
  // This function properly checks bounds
  if (index >= 0 && index < arr.length) {
    return arr[index];
  } else {
    return null; // Safe fallback
  }
}

// Example 5: Infinite loop potential
function testInfiniteLoop() {
  let i = 0;
  
  // This could potentially cause an infinite loop
  while (i < 10) {
    console.log(i);
    // Missing increment - could cause infinite loop
    // i++; // This line is missing
  }
}

// Example 6: Bubble sort with bounds checking
function bubbleSort(arr) {
  const n = arr.length;
  
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // Proper bounds checking - j and j+1 are always within bounds
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  
  return arr;
}

// Example 7: Binary search with bounds checking
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    // Proper bounds checking
    if (mid >= 0 && mid < arr.length) {
      if (arr[mid] === target) {
        return mid;
      } else if (arr[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    } else {
      // This should never happen with proper implementation
      break;
    }
  }
  
  return -1; // Not found
}

// Export functions for testing
module.exports = {
  testArrayBounds,
  testStringBounds,
  testDivisionByZero,
  testProperBounds,
  testInfiniteLoop,
  bubbleSort,
  binarySearch
};

console.log("Debugging test file loaded. Use these functions to test the improved debugger with bounds checking."); 