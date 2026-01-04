// src/utils/analysisRunner.js
const { runAnalysis, determineComplexity } = require('../calculator');

/**
 * A reusable function that runs a single, non-interactive analysis.
 * @param {Function} algorithm - The algorithm function to test.
 * @param {number[]} inputSizes - The array of input sizes for the test.
 * @returns {object} The raw complexity result object from determineComplexity.
 */
function runSingleAnalysis(algorithm, inputSizes, iterations = 10, inputMode = 'array') {
  if (inputSizes.length < 2) {
    // Not enough data points to run a meaningful analysis.
    return {
      bestFit: 'N/A',
      confidence: 0,
      results: [],
    };
  }
  const dataPoints = runAnalysis(algorithm, inputSizes, iterations, inputMode);
  const complexity = determineComplexity(dataPoints);
  return complexity;
}

module.exports = {
  runSingleAnalysis,
};
