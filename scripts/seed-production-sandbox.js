import 'dotenv/config';
import crypto from 'node:crypto';
import pg from 'pg';
const {Pool}=pg;
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined});
const networks=[
 {asset:'ETH',network:'Ethereum Sepolia',chainType:'evm',chainId:'11155111',rpcEnv:'RPC_ETHEREUM_SEPOLIA_URL',testnet:true,nativeAsset:'ETH'},
 {asset:'USDC',network:'Ethereum Sepolia',chainType:'evm',chainId:'11155111',rpcEnv:'RPC_ETHEREUM_SEPOLIA_URL',testnet:true,nativeAsset:'ETH'},
 {asset:'USDT',network:'Ethereum Sepolia',chainType:'evm',chainId:'11155111',rpcEnv:'RPC_ETHEREUM_SEPOLIA_URL',testnet:true,nativeAsset:'ETH'},
 {asset:'ETH',network:'Ethereum Mainnet',chainType:'evm',chainId:'1',rpcEnv:'RPC_ETHEREUM_MAINNET_URL',testnet:false,nativeAsset:'ETH'},
];
try{
 for(const n of networks){const rpc=process.env[n.rpcEnv]||null; await pool.query(`INSERT INTO network_configs(id,asset,network,chain_type,chain_id,rpc_url,confirmations_required,enabled,testnet,native_asset) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(asset,network) DO UPDATE SET rpc_url=EXCLUDED.rpc_url,chain_id=EXCLUDED.chain_id,native_asset=EXCLUDED.native_asset`,[crypto.randomUUID(),n.asset,n.network,n.chainType,n.chainId,rpc,Number(process.env.CONFIRMATIONS_REQUIRED||12),Boolean(rpc),n.testnet,n.nativeAsset]);}
 console.log('Sandbox network configuration seeded. No private keys or custody secrets are created.');
}finally{await pool.end();}
