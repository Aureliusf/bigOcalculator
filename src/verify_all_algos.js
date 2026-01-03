const { runAnalysis, determineComplexity } = require('./calculator');
const { constantTime, linearTime, quadraticTime, logarithmicTime } = require('./test_algorithms');
async function verify() {
  const tests = [
    {
      name: 'constantTime',
      fn: constantTime,
      expected: 'O(1) - Constant',
      inputs: [1000, 10000, 100000, 1000000, 5000000]
    },
    {
      name: 'linearTime',
      fn: linearTime,
      expected: 'O(n) - Linear',
      inputs: [1000, 10000, 100000, 1000000, 2000000]
    },
    {
      name: 'quadraticTime',
      fn: quadraticTime,
      expected: 'O(n^2) - Quadratic',
      inputs: [100, 200, 500, 1000, 1500] // Small inputs for n^2
    },
    {
      name: 'logarithmicTime',
      fn: (arr) => logarithmicTime(arr, -1), // Worst case search
      expected: 'O(log n) - Logarithmic',
      inputs: [1000, 10000, 100000, 1000000, 10000000] // Large inputs to distinguish log n from O(1)
    }
  ];
  let passed = 0;
  console.log('Starting Verification...\n');
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    try {
      const data = runAnalysis(test.fn, test.inputs, 10);
      const result = determineComplexity(data);

      console.log(`  Detected: ${result.bestFit}`);

      if (result.bestFit === test.expected) {
        console.log(`PASS 🫡`);
        passed++;
      } else {
        console.log(`  ❓ FAIL (Expected ${test.expected})`);
        console.log('  Debug Data:', JSON.stringify(result.results, null, 2));
      }
    } catch (e) {
      console.log(`  ❓ ERROR: ${e.message}`);
    }
    console.log('');
  }
  console.log(`Summary: ${passed}/${tests.length} tests passed.`);

  if (passed === tests.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}
verify();
