# mSOL-snapshot

## How to use it :
### With Docker :

 ```docker compose -f "docker-compose.yaml" up -d --build```

### Without Docker :
1) Download the snapshot file
```
sudo apt-get update \
&& sudo apt-get install python3-venv git -y \
&& git clone https://github.com/Alexis-1709/mSOL-snapshot \
&& cd solana-snapshot-finder \
&& python3 -m venv venv \
&& source ./venv/bin/activate \
&& pip3 install -r requirements.txt
python3 snapshot-finder.py  --snapshot_path ./
```
2) Dump data in the database
```
cd ../snapshot-etl-fork
cargo install --path=./ --features=standalone --bins
solana-snapshot-fork PATH_TO_SNAPSHOT_ARCHIVE --sqlite-out ../script/snapshot.db
```
3) Parse data
```
cd ../script
yarn
node index.js
```

### How to add new protocols :
- There is a filters.json file in solana-snapshot-fork folder, that contains the filters needed : 
    account_owners to extract all the accounts owned by the address
    account_mints to extract all the token_accounts of those mints & the mints data
    whirlpool_pool_address to extract the whirlpool pool data

- If the protocol give a collateral token to the user when he stake mSOL :
    1) add the token address in the filters.json file in account_mints
    2) in the index.js file of the script folder, there is a commented function TOKEN, edit it with the TOKEN_MINT address & the protocol name
    3) create an array at the beginning of the file with the protocol name, call the function in the main(), in the parseData function add a line with your protocol and in the function createDbAndDump add your protocol

- If the protocol give a LP token to the user :
    1) add the LP token address in the filters.json file in account_mints
    2) in the index.js file of the script folder, there is a commented function LP, edit it with the TOKEN_MINT LP address & the protocol name
     3) create an array at the beginning of the file with the protocol name, call the function in the main(), in the parseData function add a line with your protocol and in the function createDbAndDump add your protocol

- Else look for the protocol SDK and edit snapshot-etl-fork/src/bin/solana-snapshot-fork/sqlite.rs file & script/index.js file
