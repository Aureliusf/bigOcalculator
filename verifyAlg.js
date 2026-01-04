const { runSingleAnalysis } = require('./src/utils/analysisRunner');
const algorithms = require('./src/test_algorithms');

// --- Test Strategy Definitions ---
const standardStrategies = {
  'Standard Powers of 10': { generate: () => [10, 100, 1000, 10000] },
  'Standard Linear': { generate: () => [2000, 4000, 6000, 8000] },
};
const highPrecisionStrategy = { 
  'High-Precision': { generate: () => [10, 1000, 100000, 10000000] }
};
const SLOW_ALGO_THRESHOLD = 8001;

/**
 * A non-interactive helper to get a formatted result string from a raw complexity object.
 */
function formatResult(complexity) {
  let resultString = complexity.bestFit.split(' ')[0];
  if (complexity.confidence <= 75) {
    resultString += ` (Conf: ${complexity.confidence}%)`;
  }
  return resultString;
}

async function main() {
  console.log('--- Comprehensive Built-in Algorithm Verification ---');
  
  const finalResults = {};
  for (const algoName of Object.keys(algorithms)) {
    finalResults[algoName] = {};
    console.log(`\nTesting: ${algoName}...`);

    let algorithmToTest = algorithms[algoName];
    if (algoName === 'logarithmicTime') {
      algorithmToTest = (arr) => algorithms[algoName](arr, -1);
    }
    
    // Run standard tests
    for (const strategyName in standardStrategies) {
      process.stdout.write(`  - Running test: ${strategyName}... `);
      let inputSizes = standardStrategies[strategyName].generate();
      if (algoName === 'quadraticTime') {
        inputSizes = inputSizes.filter(size => size < SLOW_ALGO_THRESHOLD);
      }
      
      const complexity = runSingleAnalysis(algorithmToTest, inputSizes);
      finalResults[algoName][strategyName] = formatResult(complexity);
      process.stdout.write('Done.\n');
    }

    // Automatically run high-precision test for fast algorithms
    if (['constantTime', 'logarithmicTime'].includes(algoName)) {
      process.stdout.write(`  - Running test: High-Precision... `);
      const hpInputSizes = highPrecisionStrategy['High-Precision'].generate();
      const hpComplexity = runSingleAnalysis(algorithmToTest, hpInputSizes);
      finalResults[algoName]['High-Precision'] = formatResult(hpComplexity);
      process.stdout.write('Done.\n');
    }
  }

  console.log('\n--- Final Verification Summary ---');
  console.table(finalResults);
}

main().catch(console.error);
