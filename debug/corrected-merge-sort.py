# Corrected Merge Sort Implementation
# This version fixes all the bugs in the original code

def merge_sort(arr):
    if len(arr) <= 1:
        return arr

    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])

    return merge(left, right)

def merge(left, right):
    sorted_arr = []
    i = j = 0

    # FIXED: Changed <= to < to prevent index out of bounds
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            sorted_arr.append(left[i])
            i += 1
        else:
            sorted_arr.append(right[j])
            j += 1

    # FIXED: Changed i+1 to i and j+1 to j to include remaining elements
    sorted_arr.extend(left[i:])
    sorted_arr.extend(right[j:])

    return sorted_arr

# Example
arr = [38, 27, 43, 3, 9, 82, 10]
print("Unsorted:", arr)
print("Sorted:", merge_sort(arr))

# Test with edge cases
print("\nEdge cases:")
print("Empty array:", merge_sort([]))
print("Single element:", merge_sort([5]))
print("Two elements:", merge_sort([3, 1]))
print("Duplicate elements:", merge_sort([3, 1, 3, 1, 3])) 