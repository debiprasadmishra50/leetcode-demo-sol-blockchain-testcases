async function runTests() {
  const contractCode = document.getElementById("contractCode").value;

  const testCases = [
    {
      functionName: "addNumbers",
      params: [2, 3],
      expected: 1,
    },
    {
      functionName: "subtractNumbers",
      params: [5, 3],
      expected: 1,
    },
    {
      functionName: "subtractNumbers", // Should fail
      params: [6, 3],
      expected: 1,
    },
  ];

  try {
    const response = await fetch("http://localhost:3000/run-tests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contractCode, testCases }),
    });

    if (!response.ok) {
      throw new Error("Failed to run test cases.");
    }

    const data = await response.json();
    const { totalTestCases, totalPassed, totalFailed, failures } = data;

    let output = `Total Test Cases: ${totalTestCases}\n`;
    output += `Total Passed: ${totalPassed}\n`;
    output += `Total Failed: ${totalFailed}\n\n`;

    if (failures.length > 0) {
      output += "Failures:\n";
      failures.forEach((failure) => {
        output += `Function: ${failure.functionName}\n`;
        output += `Params: ${JSON.stringify(failure.params)}\n`;
        output += `Expected: ${failure.expected}\n`;
        output += `Result: ${failure.result || failure.error}\n\n`;
      });
    }

    document.getElementById("results").textContent = output;
  } catch (error) {
    console.error(error);
    document.getElementById("results").textContent = "Failed to run test cases.";
  }
}
