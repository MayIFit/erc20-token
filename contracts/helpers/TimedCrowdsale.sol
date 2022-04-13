// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Crowdsale.sol";

/**
 * @title TimedCrowdsale
 * @dev Crowdsale accepting contributions only within a time frame.
 */
contract TimedCrowdsale is Crowdsale {
    using SafeMath for uint256;

    uint256[3][] private _rates;
    uint8 private _decimals;

    /**
     * @dev Reverts if not in crowdsale time range.
     */
    modifier onlyWhileOpen() {
        require(isOpen(), "TimedCrowdsale: not open");
        _;
    }

    /**
     * @dev Constructor, takes crowdsale opening and closing times.
     * @dev The length of the rates (elements in the array) should not
     * be too high as iterating over huge arrays can cause out of gas exceptions.
     * @param decimals_ Crowdsale rates
     * @param rates_ Crowdsale rates
     * @param wallet_ Crowdsale wallet
     * @param token_ Crowdsale token
     */
    constructor(
        uint8 decimals_,
        uint256[3][] memory rates_,
        address payable wallet_,
        IERC20 token_
    ) Crowdsale(rates_[0][0], wallet_, token_) {
        _rates = rates_;
        _decimals = decimals_;
    }

    /**
     * @dev Returns the rate of tokens per wei at the present time.
     * @return The number of tokens a buyer gets per wei at a given time
     */
    function getCurrentRate() public view virtual returns (uint256) {
        require(_rates.length > 0, "Rates length");

        // solhint-disable-next-line not-rely-on-time
        uint256 currentTime = block.timestamp;
        uint256 currentRate = _rates[0][0];
        for (uint8 i = 0; i < _rates.length; i++) {
            if (currentTime >= _rates[i][1] && currentTime <= _rates[i][2]) {
                currentRate = _rates[i][0];
            }
        }

        return currentRate;
    }

    function getCurrentOpenTime() public view virtual returns (uint256) {
        require(_rates.length > 0, "Rates length");

        // solhint-disable-next-line not-rely-on-time
        uint256 currentTime = block.timestamp;
        uint256 openTime = _rates[0][1];
        for (uint8 i = 0; i < _rates.length; i++) {
            if (currentTime >= _rates[i][1] && currentTime <= _rates[i][2]) {
                openTime = _rates[i][1];
            }
        }

        return openTime;
    }

    function getCurrentCloseTime() public view virtual returns (uint256) {
        require(_rates.length > 0, "Rates length");

        // solhint-disable-next-line not-rely-on-time
        uint256 currentTime = block.timestamp;
        uint256 closeTime = _rates[0][2];
        for (uint8 i = 0; i < _rates.length; i++) {
            if (currentTime >= _rates[i][1] && currentTime <= _rates[i][2]) {
                closeTime = _rates[i][2];
            }
        }

        return closeTime;
    }

    function getRates() public view virtual returns (uint256[3][] memory) {
        return _rates;
    }

    /**
     * @dev Overrides parent method taking into account variable rate.
     * @param weiAmount The value in wei to be converted into tokens
     * @return The number of tokens _weiAmount wei will buy at present time
     */
    function _getTokenAmount(uint256 weiAmount)
        internal
        view
        override
        returns (uint256)
    {
        uint256 currentRate = getCurrentRate();
        return weiAmount.div(currentRate) * 10**_decimals;
    }

    /**
     * @return true if the crowdsale is open, false otherwise.
     */
    function isOpen() public view virtual returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return
            block.timestamp >= getCurrentOpenTime() &&
            block.timestamp <= getCurrentCloseTime();
    }

    /**
     * @dev Checks whether the period in which the crowdsale is open has already elapsed.
     * @return Whether crowdsale period has elapsed
     */
    function hasClosed() public view returns (bool) {
        // solhint-disable-next-line not-rely-on-time
        return block.timestamp > getCurrentCloseTime();
    }

    /**
     * @dev Checks whether the final period in which the crowdsale is open has already elapsed.
     * @return Whether crowdsale final period has elapsed
     */
    function hasFinalClosed() public view returns (bool) {
        return block.timestamp > _rates[_rates.length - 1][2];
    }

    /**
     * @dev Extend parent behavior requiring to be within contributing period.
     * @param beneficiary Token purchaser
     * @param weiAmount Amount of wei contributed
     */
    function _preValidatePurchase(address beneficiary, uint256 weiAmount)
        internal
        view
        override
        onlyWhileOpen
    {
        super._preValidatePurchase(beneficiary, weiAmount);
    }
}
