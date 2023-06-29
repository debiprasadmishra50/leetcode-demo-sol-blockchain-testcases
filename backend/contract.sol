// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Contract {
    function addNumbers(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }

    function subtractNumbers(
        uint256 a,
        uint256 b
    ) public pure returns (uint256) {
        return a - b;
    }
}
