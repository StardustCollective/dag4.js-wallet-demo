
import {dag4, Dag4Types} from '@stardust-collective/dag4';
import PendingTx = Dag4Types.PendingTx;
import fetch from 'node-fetch';

dag4.network.config({
  id: 'ceres',
  beUrl: 'https://api-be.exchanges.constellationnetwork.io',
  lbUrl: 'http://lb.exchanges.constellationnetwork.io:9000'
});

dag4.di.useFetchHttpClient(fetch);

(async function () {

  const service = dag4.di.createRestApi('https://us-central1-dag-faucet.cloudfunctions.net/main/api/v1/faucet/ceres/');

  //Create Node Wallet
  const nodeKey = await dag4.keyStore.generatePrivateKey();
  const nodeAddress = await dag4.keyStore.getDagAddressFromPrivateKey(nodeKey);

  dag4.account.loginPrivateKey(nodeKey);

  console.log('nodeKey: ' + nodeKey);

  const ftx = await service.$get<PendingTx>(nodeAddress);

  console.log('Faucet: ' + JSON.stringify(ftx));

  //Wait for tx to be accepted into a checkpoint block. A call to last-ref after this point will have updated ordinals.
  await dag4.account.waitForCheckPointAccepted(ftx.hash);

  console.log('waitForCheckPointAccepted');

  //Before sending tokens, verify they have arrived from faucet
  const changed =  await dag4.account.waitForBalanceChange(0);

  console.log('waitForBalanceChange ', changed);

  const tx1 = await dag4.account.transferDag('DAG4So5o9ACx5BFQha9FAMgvzkJAjrbh3zotdDax', 1, 0, true);
  console.log('transferDag: ' + JSON.stringify(tx1));

  await dag4.account.waitForCheckPointAccepted(tx1.hash);

  console.log('waitForCheckPointAccepted');

  //Auto-estimate-fee feature will detect a previous pending tx and change the fee from 0 to 1e-8
  //  Also since the max available amount is being sent, the fee will be deducted from this amount. 999 - 1e-8
  const tx2 = await dag4.account.transferDag('DAG4So5o9ACx5BFQha9FAMgvzkJAjrbh3zotdDax', 999, 0, true);
  console.log('transferDag: ' + JSON.stringify(tx2));



})();


