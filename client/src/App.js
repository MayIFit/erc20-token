import React, { Component } from 'react';
import dayjs from 'dayjs';
import Token from './contracts/Token.json';
import TokenSale from './contracts/TokenSale.json';
import Splitter from './contracts/Splitter.json';
import getWeb3 from './getWeb3';

class App extends Component {
  state = {
    loaded: false,
    tokenName: '',
    tokenSaleAddress: '',
    userTokens: 0,
    saleStart: undefined,
    saleOpen: false,
    saleEnd: undefined,
    saleFinalised: undefined,
    tokenAmount: 1,
    rate: 0,
    lockedTokens: 0,
    decimals: 0,
  };
  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      this.networkId = await this.web3.eth.getChainId();

      this.token = await new this.web3.eth.Contract(
        Token.abi,
        Token.networks[this.networkId]?.address,
      );

      this.tokenSale = await new this.web3.eth.Contract(
        TokenSale.abi,
        TokenSale.networks[this.networkId]?.address,
      );

      this.splitter = await new this.web3.eth.Contract(
        Splitter.abi,
        Splitter.networks[this.networkId]?.address,
      );

      window.ethereum.on('accountsChanged', function (accounts) {
        window.location.reload();
      });

      window.ethereum.on('chainChanged', function (accounts) {
        window.location.reload();
      });

      // Get all rates for tokensale
      this.rates = await this.tokenSale.methods.getRates().call();
      this.listenToTokenTransfer();
      this.setState(
        {
          loaded: true,
          tokenName: await this.token.methods.name().call(),
          tokenSaleAddress: this.tokenSale._address,
          decimals: await this.token.methods.decimals().call(),
          saleStart: await this.tokenSale.methods.getCurrentOpenTime().call(),
          saleOpen: await this.tokenSale.methods.isOpen().call(),
          saleEnd: await this.tokenSale.methods.getCurrentCloseTime().call(),
          rate: await this.tokenSale.methods.getCurrentRate().call(),
          saleFinalised: this.rates[this.rates.length - 1][2],
        },
        () => {
          this.updateUserTokens();
          this.updateLockedTokens();
        },
      );
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="container mx-auto">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center">
            <img width="300" src="/ipon_logo.png" alt="ipon logo" />
            <h1>{this.state.tokenName} token</h1>

            <div className="flex w-full flex-col items-center justify-center">
              <p>Token sale begins at: </p>

              <p>
                {dayjs.unix(this.getNextOpenTIme()).format('YYYY.MM.DD HH:mm')}
              </p>
            </div>
          </div>

          {this.state.saleOpen && (
            <div className="flex flex-col items-center">
              <h2>Buy {this.state.tokenName} Tokens</h2>
              <p>
                You can either send Ether to this address:{' '}
                {this.state.tokenSaleAddress} or click the button below!
              </p>

              <div className="h-10 w-32 mb-16">
                <label
                  htmlFor="tokenAmount"
                  className="w-full text-gray-700 text-sm font-semibold"
                >
                  Token Amount
                </label>
                <div className="flex flex-row h-10 w-full rounded-lg relative bg-transparent mt-1">
                  <button
                    onClick={this.decrementTokenAmount}
                    className=" bg-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-20 rounded-l cursor-pointer outline-none"
                  >
                    <span className="m-auto text-2xl font-thin">−</span>
                  </button>
                  <input
                    type="number"
                    className="outline-none focus:outline-none text-center w-full bg-gray-300 font-semibold text-md hover:text-black focus:text-black  md:text-basecursor-default flex items-center text-gray-700"
                    name="tokenAmount"
                    id="tokenAmount"
                    step="0.000000001"
                    value={this.state.tokenAmount}
                    onChange={this.handleInputChange}
                  ></input>
                  <button
                    onClick={this.incrementTokenAmount}
                    className="bg-gray-300 text-gray-600 hover:text-gray-700 hover:bg-gray-400 h-full w-20 rounded-r cursor-pointer"
                  >
                    <span className="m-auto text-2xl font-thin">+</span>
                  </button>
                </div>
              </div>

              <button
                className="bg-blue-500 text-white p-4 rounded-md"
                type="button"
                onClick={this.handleBuyToken}
              >
                Buy tokens
              </button>
            </div>
          )}
          {this.state.lockedTokens > 0 && (
            <p>
              You have {this.state.lockedTokens.toLocaleString()} locked CLS
              tokens so far.
            </p>
          )}
          <p>
            Tokens can be withdrawn after:{' '}
            {dayjs.unix(this.state.saleFinalised).format('YYYY.MM.DD HH:mm')}
          </p>

          {dayjs.unix(this.state.saleFinalised).isBefore(dayjs()) && (
            <div>
              {this.state.lockedTokens > 0 && (
                <button
                  className="bg-blue-500 text-white p-4 rounded-md"
                  type="button"
                  onClick={this.acquireTokens}
                >
                  Withdraw tokens
                </button>
              )}
              <p>
                You have: {this.state.userTokens.toLocaleString()} CLS tokens
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value,
    });
  };

  incrementTokenAmount = () => {
    this.setState({
      tokenAmount: this.state.tokenAmount + 1,
    });
  };

  decrementTokenAmount = () => {
    let newAmount = this.state.tokenAmount - 1;
    if (newAmount < 0) {
      newAmount = 0;
    }

    this.setState({
      tokenAmount: newAmount,
    });
  };

  handleBuyToken = async () => {
    if (!(await this.tokenSale.methods.isOpen().call())) {
      return false;
    }
    try {
      await this.tokenSale.methods.buyTokens(this.accounts[0]).send({
        from: this.accounts[0],
        value: this.web3.utils.toWei(
          (this.state.tokenAmount * this.state.rate).toString(),
          'wei',
        ),
      });
    } catch (error) {
      console.error(error);
    }
  };

  updateUserTokens = async () => {
    let userTokens = await this.token.methods
      .balanceOf(this.accounts[0])
      .call();

    this.setState({
      userTokens: userTokens / Math.pow(10, this.state.decimals),
    });
  };

  updateLockedTokens = async () => {
    let lockedTokens = await this.tokenSale.methods
      .balanceOf(this.accounts[0])
      .call();

    this.setState({
      lockedTokens: lockedTokens / Math.pow(10, this.state.decimals),
    });
  };

  listenToTokenTransfer = async () => {
    this.token.events.Transfer({ to: this.accounts[0] }).on('data', () => {
      this.updateUserTokens();
      this.updateLockedTokens();
    });
  };

  acquireTokens = async () => {
    this.tokenSale.methods
      .withdrawTokens(this.accounts[0])
      .send({ from: this.accounts[0] });
  };

  acquireETH = async () => {
    this.splitter.methods
      .release(this.accounts[0])
      .send({ from: this.accounts[0] });
  };

  getNextOpenTIme = () => {
    const time = dayjs().unix();
    const r = this.rates.findIndex((rate, id) => {
      return time <= parseInt(rate[2]);
    });

    if (time < this.rates[0][2]) return this.rates[0][1];
    return this.rates[r + 1][1];
  };
}

export default App;
