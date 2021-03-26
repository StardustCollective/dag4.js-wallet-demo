import {dag4} from '@stardust-collective/dag4';
import fetch from 'node-fetch';
import {WalletDemo} from './wallet-demo';
const { LocalStorage } = require('node-localstorage');

dag4.di.useFetchHttpClient(fetch);
dag4.di.useLocalStorageClient(new LocalStorage('./scratch'));
dag4.network.config({
  id: 'ceres',
  beUrl: 'https://api-be.exchanges.constellationnetwork.io',
  lbUrl: 'http://lb.exchanges.constellationnetwork.io:9000'
})

const wallet = new WalletDemo();

async function run() {
  await wallet.run();
}

run();

