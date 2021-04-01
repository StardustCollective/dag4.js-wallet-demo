
import {dag4, Dag4Types} from '@stardust-collective/dag4';
import {DagWalletMonitorUpdate} from '@stardust-collective/dag4-wallet';
import {Subscription} from 'rxjs';
import fetch from 'node-fetch';
// const { LocalStorage } = require('node-localstorage');

dag4.di.useFetchHttpClient(fetch);

//Local Storage is used by dag4.monitor to persist pending txs between sessions.
//Leave commented out to use the DefaultSessionStorage impl that is memory-bound for state storage
// dag4.di.useLocalStorageClient(new LocalStorage('./scratch'));

// TESTNET
dag4.network.config({
  id: 'ceres',
  beUrl: 'https://api-be.exchanges.constellationnetwork.io',
  lbUrl: 'http://lb.exchanges.constellationnetwork.io:9000'
})

const PASSWORD = 'test123';
const FAUCET_ADDRESS = 'DAG4So5o9ACx5BFQha9FAMgvzkJAjrbh3zotdDax';
const FAUCET_URL = 'https://us-central1-dag-faucet.cloudfunctions.net/main/api/v1/faucet/'

export class WalletDemo {

  private wallet1PrivateKey: string;
  private wallet2PrivateKey: string;
  private wallet1DAGAddress: string;
  private wallet2DAGAddress: string;
  private subscription: Subscription;

  constructor () {
    this.subscription = dag4.monitor.observeMemPoolChange().subscribe((U) => this.pollPendingTxs(U));
  }

  /*
      The following is not used in the demo.
      It is an example of how to generate an encrypted private key, decrypt it and get the DAG address.
      NOTE: Encrypt/Decrypt are both cpu intensive operations.
   */
  async createEncryptedWalletsAB () {
    //Create Wallet A using JsonPrivateKey. Encrypted JsonPrivateKey requires password to later decrypt.
    const jsonPrivateKey: JSONPrivateKey = await dag4.keyStore.generateEncryptedPrivateKey(PASSWORD);

    //decrypt JSON to extract the private key
    this.wallet1PrivateKey = await dag4.keyStore.decryptPrivateKey(jsonPrivateKey, PASSWORD);
    this.wallet1DAGAddress = await dag4.keyStore.getDagAddressFromPrivateKey(this.wallet1PrivateKey);
  }

  async createWallets1and2 () {

    //Create Wallet #1 using generatePrivateKey
    this.wallet1PrivateKey = await dag4.keyStore.generatePrivateKey();
    this.wallet1DAGAddress = await dag4.keyStore.getDagAddressFromPrivateKey(this.wallet1PrivateKey);

    //Create Wallet #2 using generatePrivateKey
    this.wallet2PrivateKey = await dag4.keyStore.generatePrivateKey();
    this.wallet2DAGAddress = await dag4.keyStore.getDagAddressFromPrivateKey(this.wallet2PrivateKey);

    console.log(`Wallet 1: ${dag4.network.getNetwork().lbUrl}/address/${this.wallet1DAGAddress}`);
    console.log(`Wallet 2: ${dag4.network.getNetwork().lbUrl}/address/${this.wallet2DAGAddress}`);
  }

  async tapFaucet (address: string) {

    if (dag4.keyStore.validateDagAddress(address)) {

      const networkId = dag4.network.getNetwork().id || 'ceres';

      const faucetApi = dag4.di.createRestApi(FAUCET_URL);

      const pendingTx = await faucetApi.$get<Dag4Types.PendingTx>(networkId + '/' + address, {amount: 1});

      console.log(`tapFaucet to ${address} - ${dag4.network.getNetwork().lbUrl}/transaction/${pendingTx.hash}`);

      console.log(JSON.stringify(pendingTx,null,2));

      return true;
    }

    throw new Error('invalid DAG address');
  }

  /*
      This method is used to check for a balance at the destination address.
      Since this demo is creating new addresses each time the initial balance will be zero.
      Once a balance is detected, then the tokens are available to be transferred away.
   */
  async checkBalance (address: string, label: string, maxCycles = 8) {

    for (let i = 1; ; i++) {

      console.log('Check Balance ' + label + '(' + i + ')');

      const balanceObj = await dag4.network.loadBalancerApi.getAddressBalance(address);

      if (balanceObj && balanceObj.balance) {
        console.log('Check Balance - SUCCESS');
        break;
      }

      if (i > maxCycles) {
        throw new Error(label + ' Failed. Try again.')
      }

      await this.wait();
    }
  }

  async run () {

    await this.createWallets1and2();

    //Set the active account to Wallet 1
    dag4.account.loginPrivateKey(this.wallet1PrivateKey);

    await this.tapFaucet(dag4.account.address);

    await this.checkBalance(dag4.account.address, 'Faucet');

    const fee = await dag4.account.getFeeRecommendation();

    let pendingTx = await dag4.account.transferDag(this.wallet2DAGAddress, 1, fee);

    console.log('Transfer Dag, from Wallet 1 to Wallet 2');
    console.log(`${dag4.network.getNetwork().lbUrl}/transaction/${pendingTx.hash}`);
    console.log(JSON.stringify(pendingTx,null,2));

    dag4.monitor.addToMemPoolMonitor(pendingTx);

    await dag4.monitor.waitForTransaction(pendingTx.hash);

    //Switch to Wallet 2
    dag4.account.loginPrivateKey(this.wallet2PrivateKey);

    pendingTx = await dag4.account.transferDag(FAUCET_ADDRESS, 1);

    console.log('Transfer Dag from Wallet #2 back to Faucet');
    console.log(`${dag4.network.getNetwork().lbUrl}/transaction/${pendingTx.hash}`);
    console.log(JSON.stringify(pendingTx,null,2));

    await this.checkCheckPointBlockStatus(pendingTx.hash);

    console.log('DONE');

    return true;
  }

  /*
    Use checkTransactionStatus to poll the Node for ACCEPTED status.
    Once a transaction is accepted, it means the Validator nodes will include it in the next validation round.
    To further monitor the status of a tx, use dag4.monitor to track the tx until it is confirmed in the
    network's global state.
   */
  private async checkCheckPointBlockStatus (hash: string) {

    for (let i = 1; ; i++) {

      const result = await dag4.network.loadBalancerApi.checkTransactionStatus(hash);

      if (result.accepted) {
        console.log('Checkpoint Block Status - ACCEPTED');
        break;
      }
      else if (result.inMemPool) {
        console.log('Checkpoint Block Status - MEM_POOL' + '(' + i + ')');
      }

      await this.wait();
    }


  }


  private async wait (time = 5): Promise<boolean> {

    let waitPromiseResolve: (val: boolean) => void;

    const p = new Promise<boolean>(resolve => waitPromiseResolve = resolve);

    setTimeout(() => {
      waitPromiseResolve(true);
    }, time * 1000);

    return p;
  }

  private async pollPendingTxs (update: DagWalletMonitorUpdate) {

    if (update.txChanged) {
      console.log('pollPendingTxs');
      console.log(JSON.stringify(update, null, 2));
    }
    else {
      console.log('pollPendingTxs - No Change, Last status: [', update.transTxs.map(tx => tx.status).join(', '),']');
    }
  }


}

type JSONPrivateKey = {
  crypto: {
    cipher: string;
    cipherparams: {
      iv: string;
    };
    ciphertext: string;
    kdf: string;
    kdfparams: any;
    mac: string;
  };
  id: string;
  version: number;
}

const wallet = new WalletDemo();

wallet.run();
