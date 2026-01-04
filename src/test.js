const path = require('path');
const { runAnalysis, determineComplexity } = require('./calculator');
const algorithms = require('./test_algorithms');
const { getNumberFromConsole, getOptionFromConsole, getYesNoFromConsole } = require('./utils/input');
const { createGraph } = require('./utils/plot');
const { getFileWithAutocomplete } = require('./utils/inputAsync');

/**
 * Displays the analysis results and handles graph generation.
 */
async function displayAnalysis(complexity, dataPoints) {
  console.log("\n--- Complexity Analysis ---");
  console.log(`Most likely Big O: \x1b[32m${complexity.bestFit}\x1b[0m`);

  const confidenceColor = complexity.confidence > 75 ? '\x1b[32m' : '\x1b[31m';
  console.log(`Confidence: ${confidenceColor}${complexity.confidence}%\x1b[0m`);
  
  if (complexity.confidence <= 75) {
      console.log("\x1b[33mWarning: Low confidence detected. The data may be noisy or the algorithm might differ from standard complexity classes.\x1b[0m");
  }

  console.log("Model Fit (RMSE - Lower is better):");
  complexity.results.forEach(res => {
    console.log(`  ${res.type}: ${res.rmse.toFixed(6)}`);
  });

  try {
    const graphPath = await createGraph(dataPoints, complexity.bestFit, complexity.confidence);
    console.log(`\nGraph generated: ${graphPath}`);
  } catch (error) {
    console.error(`\nFailed to generate graph: ${error.message}`);
  }
}

/**
 * A wrapper for runAnalysis that also handles displaying results.
 */
async function runAndDisplayAnalysis(algorithm, selectedAlgoName, inputSizes, inputMode = 'array') {
  console.log(`\nTesting ${selectedAlgoName} with input sizes: ${inputSizes.join(', ')}`);
  console.log("Running analysis (10 iterations per size)... please wait.\n");

  const dataPoints = runAnalysis(algorithm, inputSizes, 10, inputMode);
  console.log("Results:");
  console.table(dataPoints);

  const complexity = determineComplexity(dataPoints);
  
  await displayAnalysis(complexity, dataPoints);
  
  return complexity;
}

async function main() {
  console.log("---- Big O Calculator & Tester ----");

  // 1. Select Algorithm Source
  const sourceOptions = ['Built-in Algorithms', 'Load Custom Function from File'];
  const source = getOptionFromConsole("Select algorithm source:", sourceOptions);
  
  if (!source) return;

  let algorithm;
  let selectedAlgoName;
  let inputMode = 'array'; // Default for built-ins

  if (source === 'Built-in Algorithms') {
    const algoNames = Object.keys(algorithms);
    selectedAlgoName = getOptionFromConsole("Select an algorithm to test:", algoNames);
    if (!selectedAlgoName) return;
    algorithm = algorithms[selectedAlgoName];
  } else {
    const filePath = await getFileWithAutocomplete("Enter path to file (Tab for autocomplete): ");
    if (!filePath) return;
    let absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
    try {
      console.log(`Loading module from: ${absolutePath}`);
      const customModule = require(absolutePath);
      if (typeof customModule === 'function') {
        algorithm = customModule;
        selectedAlgoName = customModule.name || 'Custom Function';
      } else if (typeof customModule === 'object') {
        const exports = Object.keys(customModule).filter(k => typeof customModule[k] === 'function');
        if (exports.length === 0) { throw new Error("No exported functions found in that file."); }
        selectedAlgoName = getOptionFromConsole("Select exported function to test:", exports);
        if (!selectedAlgoName) return;
        algorithm = customModule[selectedAlgoName];
      } else {
        throw new Error("Module does not export a function or object.");
      }

      const inputModeOptions = [
        'Array of n items (for sorting, iteration, etc.)',
        'The number n itself (for mathematical, digit-based functions, etc.)'
      ];
      const selectedModeDescription = getOptionFromConsole("\nHow should the input 'n' be passed to your function?", inputModeOptions);
      if (!selectedModeDescription) return;
      inputMode = selectedModeDescription.includes('Array') ? 'array' : 'number';

    } catch (error) {
      console.error(`Error loading file: ${error.message}`);
      return;
    }
  }

  // Special handling for logarithmicTime
  if (selectedAlgoName === 'logarithmicTime') {
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
    for (let i = 1; i <= maxPower; i++) inputSizes.push(10 ** i);
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
    for (let i = 0; i < count; i++) inputSizes.push(startSize + (i * stepSize));
  }

  // 3. Run Initial Analysis
  const initialComplexity = await runAndDisplayAnalysis(algorithm, selectedAlgoName, inputSizes, inputMode);

  // 4. Offer High-Precision Re-run or advice for low-confidence results
  if (initialComplexity.confidence <= 75) {
    const bestFit = initialComplexity.bestFit;
    const isFastIsh = bestFit.includes('O(1)') || bestFit.includes('O(log n)') || bestFit.includes('O(n)') || bestFit.includes('O(n log n)');
    const isSlow = bestFit.includes('O(n^2)');
    
    let userWantsRerun = false;

    if (isFastIsh) {
      console.log('\n---');
      userWantsRerun = getYesNoFromConsole('The confidence score is low. Would you like to run a high-precision analysis to get a more accurate result?');
    } else if (isSlow) {
      console.log('\n---');
      console.log('\x1b[33mWarning:\x1b[0m The tool suspects this algorithm is O(n^2), but confidence is low.');
      console.log('A high-precision test can provide a better result, but if the algorithm truly is O(n^2) or slower, it could take an extremely long time to complete.');
      userWantsRerun = getYesNoFromConsole('Would you like to run the high-precision test anyway?');
    }

    if (userWantsRerun) {
      console.log('\nRunning high-precision analysis with the "Super Range" strategy...');
      const highPrecisionInputSizes = [10, 1000, 100000, 10000000]; // Optimal "Super Range"
      await runAndDisplayAnalysis(algorithm, selectedAlgoName, highPrecisionInputSizes, inputMode);
    }
  }
}

main();
