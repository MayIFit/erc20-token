require('dotenv').config({ path: '../.env' });

const chai = require('./chaisetup.js');
const BN = web3.utils.BN;
const expect = chai.expect;

const Token = artifacts.require('./Token.sol');
const TokenSale = artifacts.require('./TokenSale.sol');

contract('TokenSale', function (accounts) {
  const [creator, dev, other] = accounts;

  beforeEach(async () => {
    this.token = await Token.deployed();

    this.crowdSale = await TokenSale.deployed();
  });

  it('the biggest portion of coins should be in the creators account', async () => {
    let instance = this.token;
    return expect(
      instance.balanceOf.call(creator),
    ).to.eventually.be.a.bignumber.equal(new BN('75000000000000000'));
  });

  it('a smaller portion of coins should be in the tokensale smart contract', async () => {
    let instance = (this.token = await Token.deployed());
    let balance = await instance.balanceOf.call(this.crowdSale.address);
    return expect(balance).to.be.a.bignumber.equal(new BN('25000000000000000'));
  });

  it('should not be possible to buy token before open time', async () => {
    let instance = this.token;
    let balanceBeforeAccount = await instance.balanceOf.call(other);

    await expect(
      this.crowdSale.sendTransaction({
        from: other,
        value: web3.utils.toWei('1', 'wei'),
      }),
    ).to.be.rejected;

    return expect(balanceBeforeAccount).to.be.bignumber.equal(
      await instance.balanceOf.call(other),
    );
  });

  it('should be possible to buy token after open time', async () => {
    let instance = this.token;
    let balanceBeforeAccount = await instance.balanceOf.call(creator);
    await expect(
      this.crowdSale.buyTokens(other, {
        from: other,
        value: web3.utils.toWei('82500000000000', 'wei'),
      }),
    ).to.be.fulfilled;

    return expect(
      new BN(balanceBeforeAccount) + new BN(1),
    ).to.be.bignumber.equal(await instance.balanceOf.call(creator));
  });
});
