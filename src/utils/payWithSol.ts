import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
const DESTINATION_WALLET = 'Co6bkf4NpatyTCbzjhoaTS63w93iK1DmzuooCSmHSAjF'; // Crimzn's wallet
const PAYMENT_AMOUNT_SOL = 0.025;

export async function payWithSol(wallet: WalletContextState): Promise<boolean> {
  try {
    if (!wallet.connected || !wallet.publicKey || !wallet.sendTransaction) {
      throw new Error('Wallet not connected');
    }

    const connection = new Connection(SOLANA_RPC, 'confirmed');
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(DESTINATION_WALLET),
        lamports: PAYMENT_AMOUNT_SOL * 1e9,
      })
    );

    const signature = await wallet.sendTransaction(transaction, connection);
    await connection.confirmTransaction(signature, 'confirmed');
    console.log('✅ Payment successful:', signature);
    return true;
  } catch (err) {
    console.error('❌ Payment failed:', err);
    return false;
  }
}
