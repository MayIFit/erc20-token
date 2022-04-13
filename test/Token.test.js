require('dotenv').config({ path: '../.env' });
const Token = artifacts.require('./Token.sol');

const chai = require('./chaisetup.js');
const BN = web3.utils.BN;
const expect = chai.expect;

contract('Token', function (accounts) {
  const [creator, dev, other] = accounts;
  this.TOTAL_SUPPLY = new BN(
    process.env.INITIAL_TOKENS.toString() + '000000000',
  );

  beforeEach(async () => {
    this.token = await Token.new(
      process.env.TOKEN_NAME,
      process.env.TOKEN_SYMBOL,
      process.env.TOKEN_DECIMALS,
      process.env.INITIAL_TOKENS,
    );
  });

  it('has a name', async () => {
    let instance = this.token;
    return expect(instance.name()).to.eventually.be.equal(
      process.env.TOKEN_NAME,
    );
  });

  it('has a symbol', async () => {
    let instance = this.token;
    return expect(instance.symbol()).to.eventually.be.equal(
      process.env.TOKEN_SYMBOL,
    );
  });

  it('assigns the initial total supply to the creator', async () => {
    let instance = this.token;
    return expect(
      instance.balanceOf(creator),
    ).to.eventually.be.a.bignumber.equal(this.TOTAL_SUPPLY);
  });

  it('I can send tokens from Account 1 to Account 2', async () => {
    const sendTokens = 1;
    let instance = this.token;
    let totalSupply = await instance.totalSupply();
    await expect(
      instance.balanceOf(creator),
    ).to.eventually.be.a.bignumber.equal(totalSupply);
    await expect(instance.transfer(other, sendTokens)).to.eventually.be
      .fulfilled;
    await expect(
      instance.balanceOf(creator),
    ).to.eventually.be.a.bignumber.equal(totalSupply.sub(new BN(sendTokens)));
    return expect(instance.balanceOf(other)).to.eventually.be.a.bignumber.equal(
      new BN(sendTokens),
    );
  });

  it("It's not possible to send more tokens than account 1 has", async () => {
    let instance = this.token;
    let balanceOfAccount = await instance.balanceOf(creator);
    await expect(instance.transfer(other, new BN(balanceOfAccount + 1))).to
      .eventually.be.rejected;

    //check if the balance is still the same
    return expect(
      instance.balanceOf(creator),
    ).to.eventually.be.a.bignumber.equal(balanceOfAccount);
  });

  it('splits income', async () => {
    const sendTokens = 1;
    let instance = this.token;
    let totalSupply = await instance.totalSupply();
    await expect(
      instance.balanceOf(creator),
    ).to.eventually.be.a.bignumber.equal(totalSupply);

    await expect(instance.transfer(other, sendTokens)).to.eventually.be
      .fulfilled;
    await expect(
      instance.balanceOf(creator),
    ).to.eventually.be.a.bignumber.equal(totalSupply.sub(new BN(sendTokens)));

    return expect(instance.balanceOf(other)).to.eventually.be.a.bignumber.equal(
      new BN(sendTokens),
    );
  });
});
