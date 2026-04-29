// Test for handleNumberInput function
// Simulating the calculator state and functions

let currentValue = "0";
let previousValue = "";
let operation = null;
let shouldResetDisplay = false;
let displayValue = "0";

function updateDisplay(value) {
    displayValue = value;
    console.log(`Display: ${value}`);
}

function handleNumberInput(digit) {
    if (shouldResetDisplay) {
        currentValue = digit;
        shouldResetDisplay = false;
    } else {
        currentValue = currentValue === "0" ? digit : currentValue + digit;
    }
    updateDisplay(currentValue);
}

// Test cases
console.log("=== Test 1: Initial state - entering first digit ===");
handleNumberInput("5");
console.assert(currentValue === "5", "Should replace initial 0 with 5");
console.assert(displayValue === "5", "Display should show 5");

console.log("\n=== Test 2: Concatenating multiple digits ===");
handleNumberInput("3");
console.assert(currentValue === "53", "Should concatenate to 53");
console.assert(displayValue === "53", "Display should show 53");

console.log("\n=== Test 3: Adding more digits ===");
handleNumberInput("7");
console.assert(currentValue === "537", "Should concatenate to 537");
console.assert(displayValue === "537", "Display should show 537");

console.log("\n=== Test 4: Reset display flag - should replace current value ===");
shouldResetDisplay = true;
handleNumberInput("9");
console.assert(currentValue === "9", "Should reset to 9");
console.assert(shouldResetDisplay === false, "shouldResetDisplay should be false");
console.assert(displayValue === "9", "Display should show 9");

console.log("\n=== Test 5: After reset, continue concatenating ===");
handleNumberInput("2");
console.assert(currentValue === "92", "Should concatenate to 92");
console.assert(displayValue === "92", "Display should show 92");

console.log("\n=== Test 6: Reset to 0 and enter new digit ===");
currentValue = "0";
handleNumberInput("8");
console.assert(currentValue === "8", "Should replace 0 with 8");
console.assert(displayValue === "8", "Display should show 8");

console.log("\n=== All tests passed! ===");
