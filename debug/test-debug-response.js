// Test script to verify debugging system detects merge sort bugs

const testCode = `def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)

def merge(left, right):
    sorted_arr = []
    i = j = 0

    while i <= len(left) and j <= len(right):
        if left[i] < right[j]:
            sorted_arr.append(left[i])
            i += 1
        else:
            sorted_arr.append(right[j])
            j += 1

    sorted_arr.extend(left[i+1:])
    sorted_arr.extend(right[j+1:])

    return sorted_arr

# Example
arr = [38, 27, 43, 3, 9, 82, 10]
print("Unsorted:", arr)
print("Sorted:", merge_sort(arr))`;

console.log("Testing debugging system with buggy merge sort code...");
console.log("Expected bugs to detect:");
console.log("1. Line 15: while i <= len(left) - should be < to prevent index out of bounds");
console.log("2. Line 16: left[i] access when i equals len(left) - causes IndexError");
console.log("3. Line 25: left[i+1:] - should be left[i:] to include remaining elements");
console.log("4. Line 26: right[j+1:] - should be right[j:] to include remaining elements");

// Expected debug steps should include:
const expectedBugs = [
  {
    stepType: "loop_condition",
    description: "Check while loop condition",
    lineNumber: 15,
    boundsCheck: {
      isValid: false,
      issue: "Loop condition 'i <= len(left)' allows i to reach len(left), causing index out of bounds when accessing left[i]",
      suggestion: "Change 'i <= len(left)' to 'i < len(left)' to prevent accessing beyond array bounds"
    }
  },
  {
    stepType: "array_access",
    description: "Access left[i] when i equals array length",
    lineNumber: 16,
    boundsCheck: {
      isValid: false,
      issue: "Accessing left[3] when left has length 3 (indices 0,1,2) causes IndexError",
      suggestion: "Ensure i < len(left) before accessing left[i]"
    }
  },
  {
    stepType: "array_slicing",
    description: "Incorrect array slicing in extend operations",
    lineNumber: 25,
    boundsCheck: {
      isValid: false,
      issue: "left[i+1:] skips the element at index i, should be left[i:] to include all remaining elements",
      suggestion: "Change left[i+1:] to left[i:] to include all remaining elements"
    }
  }
];

console.log("\nExpected debug steps structure:");
console.log(JSON.stringify(expectedBugs, null, 2));

console.log("\nTo test the debugging system:");
console.log("1. Go to the debug page in your browser");
console.log("2. Paste the buggy merge sort code");
console.log("3. Click 'Step Debugger'");
console.log("4. Verify that the bounds checking warnings appear");
console.log("5. Check that the suggestions match the expected fixes");

module.exports = { testCode, expectedBugs }; 