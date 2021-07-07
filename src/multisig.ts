import {dag4} from "@stardust-collective/dag4";
import * as bs58 from 'bs58';
import {Buffer} from "buffer";

const redeemScriptInput = {
    "n": 3,
    "m": 2,
    "pubKeys": [
        "22da2ae740c392bb03fc8ec2a535f56d087be22f5baf2945f16b13a336242e10c00f2936f0a2d5f9ae72356bbf7b0a00baea665814a41287ec653d53f1e028f8",
        "280da053932ee8af288061a5ae06851e07494d89f3bd5fcfc1a19ce05b82a6b285c9c66bb211e552c54017c9132492cf7860c6ecc7d8f7cb6a1acf496f149f45",
        "819415194fdf552872141cfc11df03c69a1fce663e41c3d2255073b04a5547d9ce42865b3766b195cd9330d3fa5dfa75bbfa33a956956b6d266b387015f4ff09"
    ]
}

const expectedAddress = 'DAG1V9ejxtXcgAUrGPb2jYoWLnuRVT395wwB9REd';


export class Multisig {

    createKeys () {
        const key1 = dag4.keyStore.generatePrivateKey();
        const key2 = dag4.keyStore.generatePrivateKey();
        const key3 = dag4.keyStore.generatePrivateKey();

        const pubKey1 = dag4.keyStore.getPublicKeyFromPrivate(key1).substring(2);
        const pubKey2 = dag4.keyStore.getPublicKeyFromPrivate(key2).substring(2);
        const pubKey3 = dag4.keyStore.getPublicKeyFromPrivate(key3).substring(2);

        console.log('pKeys', [pubKey1, pubKey2, pubKey3]);

        const redeemScriptJson = {
            n: 3,
            m: 2,
            pubKeys: [pubKey1, pubKey2, pubKey3].sort() //keys are always same length (128) and in hex format. use string sort.
        };
        console.log('redeemScript', JSON.stringify(redeemScriptJson));
        console.log(JSON.stringify(redeemScriptJson, null, 2));
    }

    test () {

        const redeemScript = JSON.stringify(redeemScriptInput);

        const sha256Str = dag4.keyStore.sha256(Buffer.from(redeemScript, 'ascii'));

        console.log('sha256Str', sha256Str);

        const bytes = Buffer.from(sha256Str, 'hex');
        const hash = bs58.encode(bytes);

        let end = hash.slice(hash.length - 36, hash.length);
        let sum = end.split('').reduce((val: number, char: any) => (isNaN(char) ? val : val + (+char)), 0);
        let par = sum % 9;

        const computedAddress = 'DAG' + par + end;

        console.log(computedAddress, computedAddress === expectedAddress);

    }

}

const multiSig = new Multisig();

multiSig.test();

