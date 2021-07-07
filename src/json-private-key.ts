
import {dag4} from "@stardust-collective/dag4";

const PASSWORD = 'test123';

export class JsonPrivateKeyDemo {

    private wallet1PrivateKey: string;
    private wallet1DAGAddress: string;

    /*
        It is an example of how to generate an encrypted private key, decrypt it and get the DAG address.
        NOTE: Encrypt/Decrypt are both cpu intensive operations.
     */
    async createEncryptedWallets() {
        //Create Wallet A using JsonPrivateKey. Encrypted JsonPrivateKey requires password to later decrypt.
        const jsonPrivateKey: JSONPrivateKey = await dag4.keyStore.generateEncryptedPrivateKey(PASSWORD);

        //decrypt JSON to extract the private key
        this.wallet1PrivateKey = await dag4.keyStore.decryptPrivateKey(jsonPrivateKey, PASSWORD);
        this.wallet1DAGAddress = await dag4.keyStore.getDagAddressFromPrivateKey(this.wallet1PrivateKey);

        console.log('Generated private key: ' + this.wallet1PrivateKey);
        console.log('Derived DAG Address: ' + this.wallet1DAGAddress);
    }
}

const demo = new JsonPrivateKeyDemo();

demo.createEncryptedWallets();


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