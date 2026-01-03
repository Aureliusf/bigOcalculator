const { runAnalysis, determineComplexity } = require('./calculator');
const algorithms = require('./test_algorithms');
const { getNumberFromConsole, getOptionFromConsole } = require('./utils/input');

function main() {
  console.log("---- Big O Calculator & Tester ----");

  // 1. Select Algorithm
  const algoNames = Object.keys(algorithms);
  const selectedAlgoName = getOptionFromConsole("Select an algorithm to test:", algoNames);

  if (!selectedAlgoName) return;

  let algorithm = algorithms[selectedAlgoName];

  // Special handling for logarithmicTime to provide the 'target' argument
  if (selectedAlgoName === 'logarithmicTime') {
    // Wrap it to search for a value that doesn't exist (-1) for worst-case performance
    const originalAlgo = algorithm;
    algorithm = (arr) => originalAlgo(arr, -1);
  }

  // 2. Select Input Growth Strategy
  const growthStrategies = ['Powers of 10 (10, 100, 1000...)', 'Doubling (100, 200, 400...)', 'Linear Steps (1000, 2000, 3000...)'];
  const selectedStrategy = getOptionFromConsole("Select input growth strategy:", growthStrategies);

  if (!selectedStrategy) return;

  let inputSizes = [];

  if (selectedStrategy.startsWith('Powers of 10')) {
    const maxPower = getNumberFromConsole("Enter max power (e.g., 5 for 10^5): ");
    if (maxPower === null) return;
    for (let i = 1; i <= maxPower; i++) {
      inputSizes.push(10 ** i);
    }
  } else if (selectedStrategy.startsWith('Doubling')) {
    const startSize = getNumberFromConsole("Enter start size (e.g., 100): ");
    const steps = getNumberFromConsole("Enter number of doubling steps: ");
    if (startSize === null || steps === null) return;

    let current = startSize;
    for (let i = 0; i < steps; i++) {
      inputSizes.push(current);
      current *= 2;
    }
  } else if (selectedStrategy.startsWith('Linear Steps')) {
    const startSize = getNumberFromConsole("Enter start size (e.g., 1000): ");
    const stepSize = getNumberFromConsole("Enter step size (e.g., 1000): ");
    const count = getNumberFromConsole("Enter number of data points: ");
    if (startSize === null || stepSize === null || count === null) return;

    for (let i = 0; i < count; i++) {
      inputSizes.push(startSize + (i * stepSize));
    }
  }

  console.log(`\nTesting ${selectedAlgoName} with input sizes: ${inputSizes.join(', ')}`);
  console.log("Running analysis (10 iterations per size)... please wait.\n");

  // 3. Run Analysis
  const dataPoints = runAnalysis(algorithm, inputSizes);

  // 4. Display Results
  console.log("Results:");
  console.table(dataPoints);

  // 5. Determine Complexity
  const complexity = determineComplexity(dataPoints);
  console.log("\n--- Complexity Analysis ---");
  console.log(`Most likely Big O: \x1b[32m${complexity.bestFit}\x1b[0m`); // Green color
  console.log("Fit Scores (R^2):");
  complexity.results.forEach(res => {
    console.log(`  ${res.type}: ${res.r2.toFixed(4)}`);
  });
}

main();
