import {dag4, Dag4Types} from '@stardust-collective/dag4';
import fetch from 'node-fetch';

dag4.network.config({
  id: 'ceres',
  beUrl: 'https://api-be.exchanges.constellationnetwork.io',
  lbUrl: 'http://lb.exchanges.constellationnetwork.io:9000'
});

dag4.di.useFetchHttpClient(fetch);

//NOTE: assuming this is a wallet that already has a balance
const SENDER_PRIVATE_KEY = '';
const AMOUNT = 1000;

(async function () {

  //Fro the destination wallet, generate a random private key and derive its DAG address
  const destPkey = dag4.keyStore.generatePrivateKey();
  const destAddr = dag4.keyStore.getDagAddressFromPrivateKey(destPkey);

  console.log(destPkey, destAddr);

  dag4.account.loginPrivateKey(SENDER_PRIVATE_KEY);
  const tx = await dag4.account.transferDag(destAddr, AMOUNT);

  console.log(tx.hash);

})();
