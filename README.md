# mSOL-snapshot

How to use it :

1) Download the snapshot file 
- sudo apt-get update \
&& sudo apt-get install python3-venv git -y \
&& git clone https://github.com/c29r3/solana-snapshot-finder.git \
&& cd solana-snapshot-finder \
&& python3 -m venv venv \
&& source ./venv/bin/activate \
&& pip3 install -r requirements.txt
- python3 snapshot-finder.py  --snapshot_path ./
2) Dump data in the database
- cd ../snapshot-etl-fork
- cargo install --path=./ --features=standalone --bins
- solana-snapshot-fork PATH_TO_SNAPSHOT_ARCHIVE --sqlite-out ../script/snapshot.db
3) Parse data
- cd ../script
- yarn
- node index.js
