// src/calculator.js
const { performance } = require('perf_hooks');
const ss = require('simple-statistics');

/**
 * Generates an array of a specified size for testing algorithms.
 * @param {number} n The desired size of the array.
 * @returns {Array<number>} A new array of size 'n'.
 */
function generateInputArray(n) {
  return Array.from({ length: n }, (_, i) => i);
}

/**
 * Runs an algorithm with varying input sizes and collects execution times.
 * @param {Function} algorithm The function to test for Big O complexity.
 * @param {Array<number>} inputSizes An array of input sizes to test.
 * @param {number} iterations Number of times to run per input size (default 10).
 * @returns {Array<{n: number, time: number}>} An array of data points.
 */
function runAnalysis(algorithm, inputSizes, iterations = 10) {
  const dataPoints = [];

  // Warmup phase: Run with the smallest input size a few times to trigger JIT
  if (inputSizes.length > 0) {
    const warmupSize = inputSizes[0];
    const warmupArray = generateInputArray(warmupSize);
    for (let i = 0; i < 5; i++) {
      algorithm(warmupArray);
    }
  }

  for (const n of inputSizes) {
    const times = [];
    for (let i = 0; i < iterations; i++) {
      // Create a fresh array for each iteration to avoid side effects (like sorting in place)
      // although for simple read algorithms it might not matter, for sort it does.
      let array = generateInputArray(n);

      const start = performance.now();
      algorithm(array);
      const end = performance.now();
      times.push(end - start);
    }

    const avgTime = ss.mean(times);
    // or use median to remove outliers: const avgTime = ss.median(times); 
    
    dataPoints.push({ n, time: avgTime });
  }

  return dataPoints;
}

/**
 * Determines the Big O complexity based on the correlation (R^2) of the data.
 * @param {Array<{n: number, time: number}>} dataPoints
 * @returns {Object} Analysis result with R^2 scores and best fit.
 */
function determineComplexity(dataPoints) {
  // Extract N and Time values
  const nValues = dataPoints.map(d => d.n);
  const timeValues = dataPoints.map(d => d.time);

  // Prepare data for regression models
  // 1. O(1) Constant: Time vs N (Slope should be ~0, but R^2 is tricky here if strictly flat.
  //    Usually we check if variance is low or slope is near zero.
  //    For R^2 comparison, we can treat it as linear with slope 0? 
  //    Let's stick to standard regressions for growth.

  // 2. O(n) Linear: Time vs N
  const linearData = dataPoints.map(d => [d.n, d.time]);
  const linearModel = ss.linearRegression(linearData);
  const linearLine = ss.linearRegressionLine(linearModel);
  const linearR2 = ss.rSquared(linearData, linearLine);

  // 3. O(n^2) Quadratic: Time vs N^2
  // We model Time = a * N^2 + b
  const quadraticData = dataPoints.map(d => [d.n ** 2, d.time]);
  const quadraticModel = ss.linearRegression(quadraticData);
  const quadraticLine = ss.linearRegressionLine(quadraticModel);
  const quadraticR2 = ss.rSquared(quadraticData, quadraticLine);

  // 4. O(log n) Logarithmic: Time vs log(N)
  // We model Time = a * log(N) + b
  const logData = dataPoints.map(d => [Math.log(d.n), d.time]);
  const logModel = ss.linearRegression(logData);
  const logLine = ss.linearRegressionLine(logModel);
  const logR2 = ss.rSquared(logData, logLine);

  // 5. O(n log n) Linear-ithmic: Time vs N * log(N)
  const nLogNData = dataPoints.map(d => [d.n * Math.log(d.n), d.time]);
  const nLogNModel = ss.linearRegression(nLogNData);
  const nLogNLine = ss.linearRegressionLine(nLogNModel);
  const nLogNR2 = ss.rSquared(nLogNData, nLogNLine);

  // Find the best fit
  const models = [
    { type: 'O(n) - Linear', r2: linearR2 },
    { type: 'O(n^2) - Quadratic', r2: quadraticR2 },
    { type: 'O(log n) - Logarithmic', r2: logR2 },
    { type: 'O(n log n) - Linear-ithmic', r2: nLogNR2 }
  ];

  // Sort by R^2 descending
  models.sort((a, b) => b.r2 - a.r2);

  // Apply Occam's Razor: Prefer simpler models if R^2 is very close (within 0.01)
  // Complexity hierarchy (simplest to most complex): O(1) -> O(log n) -> O(n) -> O(n log n) -> O(n^2)
  // Note: We don't check O(1) in this list explicitly yet.
  
  let bestModel = models[0];
  const tolerance = 0.01;

  // Check if O(n) is close to the top model (likely O(n log n))
  const simpleLinear = models.find(m => m.type === 'O(n) - Linear');
  if (simpleLinear && bestModel.type !== 'O(n) - Linear') {
    if (bestModel.r2 - simpleLinear.r2 < tolerance) {
       bestModel = simpleLinear;
    }
  }

  // Check if O(log n) is close to the top model
  const simpleLog = models.find(m => m.type === 'O(log n) - Logarithmic');
  if (simpleLog && bestModel.type !== 'O(log n) - Logarithmic') {
     if (bestModel.r2 - simpleLog.r2 < tolerance) {
        bestModel = simpleLog;
     }
  }

  return {
    bestFit: bestModel.type,
    results: models
  };
}

module.exports = {
  generateInputArray,
  runAnalysis,
  determineComplexity
};
