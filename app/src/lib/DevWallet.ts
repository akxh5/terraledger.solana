import { BaseMessageSignerWalletAdapter, WalletName, WalletReadyState } from '@solana/wallet-adapter-base';
import { Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export class DevWalletAdapter extends BaseMessageSignerWalletAdapter {
    name = 'DevWallet' as WalletName<'DevWallet'>;
    url = 'https://localhost';
    icon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xMiAyTDQgMTB2MTJsOC04IDgtOHYxMkwxMiAyemoiLz48L3N2Zz4=';
    readyState = WalletReadyState.Installed;
    private _keypair: Keypair;
    private _publicKey: PublicKey | null = null;
    private _connecting = false;

    constructor() {
        super();
        const secretStr = "[209,1,8,233,189,58,137,74,119,140,39,103,94,186,245,166,244,114,31,195,44,74,219,62,53,39,65,110,139,10,217,192,113,62,75,136,32,111,32,163,20,105,37,155,100,203,171,40,46,55,167,177,205,165,17,150,152,221,190,223,185,32,231,51]";
        this._keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(secretStr)));
        console.log("USING HARDCODED DEV WALLET:", this._keypair.publicKey.toBase58());
    }

    get publicKey() { return this._publicKey; }
    get connecting() { return this._connecting; }

    async connect(): Promise<void> {
        this._connecting = true;
        this.emit('connecting');
        await new Promise(r => setTimeout(r, 200));
        this._publicKey = this._keypair.publicKey;
        this._connecting = false;
        this.emit('connect', this._publicKey);
    }

    async disconnect(): Promise<void> {
        this._publicKey = null;
        this.emit('disconnect');
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        if ('version' in transaction) {
            transaction.sign([this._keypair]);
        } else {
            transaction.partialSign(this._keypair);
        }
        return transaction;
    }

    async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
        return transactions.map(t => {
            if ('version' in t) {
                t.sign([this._keypair]);
            } else {
                t.partialSign(this._keypair);
            }
            return t;
        });
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        throw new Error("Method not implemented.");
    }
}
