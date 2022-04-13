const Token = artifacts.require('Token');
const Splitter = artifacts.require('Splitter');
const TokenSale = artifacts.require('TokenSale');
require('dotenv').config({ path: '../.env' });
var dayjs = require('dayjs');

require('web3');

module.exports = async function (deployer) {
  // Token
  await deployer.deploy(
    Token,
    process.env.TOKEN_NAME,
    process.env.TOKEN_SYMBOL,
    process.env.TOKEN_DECIMALS,
    process.env.INITIAL_TOKENS,
  );

  /**
   * The rates should be in ascending order based on the opening time
   * first param is the exchange rate for the token / wei
   * second param is an unix epoch for the start time
   * third param is an unix epoch for the close time
   */
  const rates = [
    [
      '120305350000000',
      dayjs('2021-11-04 00:00:00', 'YYYY-MM-DD HH:mm:ss').second(0).unix(),
      dayjs('2021-11-04 11:00:00', 'YYYY-MM-DD HH:mm:ss').second(0).unix(),
    ],
    [
      '180364942500000',
      dayjs('2021-11-04 11:05:00', 'YYYY-MM-DD HH:mm:ss').second(0).unix(),
      dayjs('2021-11-04 23:55:00', 'YYYY-MM-DD HH:mm:ss').second(0).unix(),
    ],
  ];

  const devAddress = process.env.DEV_WALLET;
  const ownerAddress = process.env.OWNER_WALLET;
  const payees = [devAddress, ownerAddress];
  const shares = [10, 90];

  // Payment splitter
  await deployer.deploy(Splitter, payees, shares);

  // Crowdsale
  await deployer.deploy(
    TokenSale,
    process.env.TOKEN_DECIMALS,
    rates,
    Splitter.address,
    Token.address,
  );

  // Transfer crowdsale
  let tokenInstance = await Token.deployed();
  await tokenInstance.transfer(
    TokenSale.address,
    web3.utils.toWei(process.env.CROWDSALE_TOKENS, 'ether'),
  );
};
