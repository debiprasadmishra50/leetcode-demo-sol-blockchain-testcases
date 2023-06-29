const express = require("express");
const solc = require("solc");
const { default: Web3 } = require("web3");
const smtchecker = require("solc/smtchecker");
const smtsolver = require("solc/smtsolver");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Compile Solidity code
function compileSolidity(code) {
  const input = {
    language: "Solidity",
    sources: {
      "contract.sol": {
        content: code,
      },
    },
    // settings: {
    //   outputSelection: {
    //     "*": {
    //       "*": ["abi", "evm.bytecode"],
    //     },
    //   },
    // },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
      modelChecker: {
        engine: "chc",
        solvers: ["smtlib2"],
      },
    },
  };

  const output = JSON.parse(
    solc.compile(JSON.stringify(input), {
      smtSolver: smtchecker.smtCallback(smtsolver.smtSolver, smtsolver.availableSolvers[0]),
    })
  );

  //   console.log(output.contracts["contract.sol"].Contract);

  const contractBytecode = output.contracts["contract.sol"].Contract.evm.bytecode.object;
  const contractABI = output.contracts["contract.sol"].Contract.abi;
  return { bytecode: contractBytecode, abi: contractABI };
}

// Run test cases
async function runTestCases(contractCode, testCases) {
  const provider = new Web3.providers.HttpProvider("http://localhost:8545");
  const web3 = new Web3(provider);

  web3.eth.accounts.wallet.add("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

  const { bytecode, abi } = compileSolidity(contractCode);

  const results = {
    totalTestCases: testCases.length,
    totalPassed: 0,
    totalFailed: 0,
    failures: [],
  };

  const from = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  for (const testCase of testCases) {
    const { functionName, params, expected } = testCase;
    const contract = new web3.eth.Contract(abi);
    const contractInstance = await contract
      .deploy({
        data: bytecode,
      })
      .send({ from, gas: 1500000 });

    console.log("[+] Deployed to:", contractInstance["_address"]);

    try {
      const result = await contractInstance.methods[functionName](...params).call({ from });
      //   console.log(functionName, params, result.toString(), expected.toString());

      if (result.toString() === expected.toString()) {
        results.totalPassed++;
      } else {
        results.totalFailed++;
        results.failures.push({
          functionName,
          params,
          expected,
          result: result.toString(),
        });
      }
    } catch (error) {
      results.totalFailed++;
      results.failures.push({ functionName, params, expected, error: error.message });
    }
  }

  return results;
}

app.post("/run-tests", async (req, res) => {
  const { contractCode, testCases } = req.body;
  try {
    const results = await runTestCases(contractCode, testCases);
    // console.log(results);

    res.json(results);
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Failed to run test cases." });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
