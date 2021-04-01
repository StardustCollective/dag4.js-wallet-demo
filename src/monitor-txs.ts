import {dag4, Dag4Types} from '@stardust-collective/dag4';
import fetch from 'node-fetch';

dag4.di.useFetchHttpClient(fetch);

dag4.network.config({
  id: 'main',
  beUrl: 'https://block-explorer.constellationnetwork.io',
  lbUrl: 'http://lb.constellationnetwork.io:9000'
});

const FIVE_SECONDS = 5000;

class MonitorTxs {

  lastSnapshotHeight = 0;

  async run () {

    const snapshot = await dag4.network.blockExplorerApi.getLatestSnapshot();

    this.lastSnapshotHeight = snapshot.height;

    console.log('Start monitoring at height: ' + snapshot.height);

    setTimeout(() => this.pollForLatest(), FIVE_SECONDS);
  }

  private async pollForLatest () {

    const nextHeight = this.lastSnapshotHeight + 2;

    console.log('pollForLatest: ' + nextHeight);

    try {
      const snapshot = await dag4.network.blockExplorerApi.getSnapshot(nextHeight);

      //Note this API may return a 404 even if the previous found a new height. In which, case
      //  we need to retry until the blockExplorer has had time to index the last snapshot and
      //  provide a result
      const txs = await dag4.network.blockExplorerApi.getTransactionsBySnapshot(nextHeight);

      this.processSnapshot(snapshot, txs);

      this.lastSnapshotHeight = nextHeight;

      setTimeout(() => this.pollForLatest(), FIVE_SECONDS);

    }
    catch(e) {
      setTimeout(() => this.pollForLatest(), FIVE_SECONDS);
    }

  }

  private processSnapshot (snapshot: Dag4Types.Snapshot, txs: Dag4Types.Transaction[]) {

    let dagAmount = 0;
    let feeAmount = 0;

    console.log('processSnapshot: #' + snapshot.height, 'TXS(', txs.length, ')');

    txs.forEach(rawTx => {

      dagAmount += rawTx.amount;
      feeAmount += rawTx.fee;

    });

    const dateTime = new Date(snapshot.timestamp);
    const currentTime = dateTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

    console.log('SNAPSHOT - ' + snapshot.height, currentTime);
    console.log('  Total DAG: ' + dagAmount);
    console.log('  Txs count: ' + txs.length);

  }
}

const monitor = new MonitorTxs();

monitor.run();
