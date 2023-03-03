const Database = require('better-sqlite3');
const db = require('better-sqlite3')('./snapshot.db');
const toUi = Math.pow(10, -9);
var fs = require('fs');
const axios = require('axios');
const whirlpool = require("@orca-so/whirlpools-sdk")
const orca = require("@orca-so/common-sdk")
const numberToBN = require('number-to-bn');

var data = {}
var owners = []
var dataMSolHolders = []
var dataSolend = []
var dataFriktion = []
var dataRaydiumV2 = []
var dataPort = []
var dataOrcaAquafarms = []
var dataOrcaWhirlpools = []
var dataTulip = []
var dataMercurial = []
var dataSaber = []


async function main(){
    mSolHolders();
    orcaWhrilpools();
    orcaAquafarms();
    raydiumV2();
    solend();
    tulip();
    mercurial();
    saber();
    friktion();
    await port();
    parseData();
    createDbAndDump();
    //createJson(); if you want to have the data in a json file (it's much faster)
    

    db.close();
    console.info(new Date().toISOString() + " DONE");
}
main();


function mSolHolders() {
    console.info(new Date().toISOString() + " Parsing mSOL holders");
    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "11111111111111111111111111111111"]); //mSOL address & system program address
    result.forEach((row) => {
        if(dataMSolHolders[row.owner] == undefined){
            dataMSolHolders[row.owner] = row.amount*toUi;
        }else{
            dataMSolHolders[row.owner] += row.amount*toUi;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

function orcaWhrilpools(){
    console.info(new Date().toISOString() + " Parsing Orca Whirlpools");

    const whirlpool_msol_usdc = db.prepare(`SELECT token_a, token_b, sqrt_price FROM whirlpool_pools WHERE pubkey= ?`).all("AiMZS5U3JMvpdvsr1KeaMiS354Z1DeSg5XjA4yYRxtFf"); //Whirlpool address
    const result = db.prepare(`SELECT orca.price_lower, orca.price_upper, orca.liquidity, token_account.owner FROM orca, token_account WHERE orca.position_mint=token_account.mint AND orca.pool= ?`).all("AiMZS5U3JMvpdvsr1KeaMiS354Z1DeSg5XjA4yYRxtFf"); //Whirlpool address
    result.forEach((row) => {
        const amounts = whirlpool.PoolUtil.getTokenAmountsFromLiquidity(
            numberToBN(row.liquidity),
            numberToBN(whirlpool_msol_usdc[0].sqrt_price),
            numberToBN(row.price_lower),
            numberToBN(row.price_upper),
            true
        );

        if(dataOrcaWhirlpools[row.owner] == undefined){
            dataOrcaWhirlpools[row.owner] = orca.DecimalUtil.fromU64(amounts.tokenA, 9).toNumber();
        }else{
            dataOrcaWhirlpools[row.owner] += orca.DecimalUtil.fromU64(amounts.tokenA, 9).toNumber();
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

function orcaAquafarms(){
    console.info(new Date().toISOString() + " Parsing Orca Aquafarms");

    const mSOL_USDT_supply = db.prepare(`SELECT supply FROM token_mint WHERE pubkey= ?`).all("Afvh7TWfcT1E9eEEWJk17fPjnqk36hreTJJK5g3s4fm8")[0].supply*Math.pow(10, -6); //Orca Aquafarm mSOL-USDT 
    const mSOL_in_liq_USDT = db.prepare(`SELECT amount FROM token_account WHERE pubkey= ?`).all("RTXKRxghfWJpE344UG7UhKnCwN2Gyv6KnNSTFDnaASF")[0].amount*toUi; //Orca Aquafarm mSOL-USDT token account which hold mSOL
    const mSOL_per_LP_USDT = mSOL_in_liq_USDT/mSOL_USDT_supply;
    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["Afvh7TWfcT1E9eEEWJk17fPjnqk36hreTJJK5g3s4fm8", "11111111111111111111111111111111"]); //Orca Aquafarm mSOL-USDT & system program 
    const resultDoubleDip = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["7iKG16aukdXXw43MowbfrGqXhAoYe51iVR9u2Nf2dCEY", "11111111111111111111111111111111"]); //Orca Double Dip mSOL-USDT & system program
    result.forEach((row) => {
        if(dataOrcaAquafarms[row.owner] == undefined){
            dataOrcaAquafarms[row.owner] = row.amount*toUi*mSOL_per_LP_USDT;
        }else{
            dataOrcaAquafarms[row.owner] += row.amount*toUi*mSOL_per_LP_USDT;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
    resultDoubleDip.forEach((row) => {
        if(dataOrcaAquafarms[row.owner] == undefined){
            dataOrcaAquafarms[row.owner] = row.amount*toUi;
        }else{
            dataOrcaAquafarms[row.owner] += row.amount*toUi;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

function raydiumV2(){
    console.info(new Date().toISOString() + " Parsing Raydium V2");

    const mSOL_USDC_supply = db.prepare(`SELECT supply FROM token_mint WHERE pubkey= ?`).all("4xTpJ4p76bAeggXoYywpCCNKfJspbuRzZ79R7pRhbqSf")[0].supply*toUi; //Raydium V2 mSOL-USDC
    const mSOL_in_liq_USDC = db.prepare(`SELECT amount FROM token_account WHERE pubkey= ?`).all("8JUjWjAyXTMB4ZXcV7nk3p6Gg1fWAAoSck7xekuyADKL")[0].amount*toUi; //Raydium V2 mSOL-USDC token account which hold mSOL
    const mSOL_per_LP_USDC = mSOL_in_liq_USDC/mSOL_USDC_supply;

    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["4xTpJ4p76bAeggXoYywpCCNKfJspbuRzZ79R7pRhbqSf", "11111111111111111111111111111111"]); //Raydium V2 mSOL-USDC & system program
    result.forEach((row) => {
        if(dataRaydiumV2[row.owner] == undefined){
            dataRaydiumV2[row.owner] = row.amount*toUi*mSOL_per_LP_USDC;
        }else{
            dataRaydiumV2[row.owner] += row.amount*toUi*mSOL_per_LP_USDC;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });

    const mSOL_SOL_supply = db.prepare(`SELECT supply FROM token_mint WHERE pubkey= ?`).all("5ijRoAHVgd5T5CNtK5KDRUBZ7Bffb69nktMj5n6ks6m4")[0].supply*toUi; //Raydium V2 mSOL-SOL
    const mSOL_in_liq_SOL = db.prepare(`SELECT amount FROM token_account WHERE pubkey= ?`).all("85SxT7AdDQvJg6pZLoDf7vPiuXLj5UYZLVVNWD1NjnFK")[0].amount*toUi; //Raydium V2 mSOL-SOL token account which hold mSOL
    const mSOL_per_LP_SOL = mSOL_in_liq_SOL/mSOL_SOL_supply;

    const result2 = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["5ijRoAHVgd5T5CNtK5KDRUBZ7Bffb69nktMj5n6ks6m4", "11111111111111111111111111111111"]); //Raydium V2 mSOL-SOL & system program
    result2.forEach((row) => {
        if(dataRaydiumV2[row.owner] == undefined){
            dataRaydiumV2[row.owner] = row.amount*toUi*mSOL_per_LP_SOL;
        }else{
            dataRaydiumV2[row.owner] += row.amount*toUi*mSOL_per_LP_SOL;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

function solend() {
    console.info(new Date().toISOString() + " Parsing Solend");
    const result = db.prepare(`SELECT owner, deposit_amount FROM Solend ORDER BY deposit_amount desc`).all();

    result.forEach((row) => {
        if(dataSolend[row.owner] == undefined){
            dataSolend[row.owner] = row.deposit_amount*toUi;
        }else{
            dataSolend[row.owner] += row.deposit_amount*toUi;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });

}

function tulip(){
    console.info(new Date().toISOString() + " Parsing Tulip");
    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["8cn7JcYVjDZesLa3RTt3NXne4WcDw9PdUneQWuByehwW", "11111111111111111111111111111111"]); //tumSOL address & system program address
    result.forEach((row) => {
        if(dataTulip[row.owner] == undefined){
            dataTulip[row.owner] = row.amount*toUi;
        }else{
            dataTulip[row.owner] += row.amount*toUi;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

function mercurial(){
    console.info(new Date().toISOString() + " Parsing Mercurial");

    const mSOL_2Pool_supply = db.prepare(`SELECT supply FROM token_mint WHERE pubkey= ?`).all("7HqhfUqig7kekN8FbJCtQ36VgdXKriZWQ62rTve9ZmQ")[0].supply*Math.pow(10, -12); //Mercurial mSOL-2Pool
    const mSOL_in_liq = db.prepare(`SELECT amount FROM token_account WHERE pubkey= ?`).all("GM48qFn8rnqhyNMrBHyPJgUVwXQ1JvMbcu3b9zkThW9L")[0].amount*Math.pow(10, -12); //Mercurial mSOL-2Pool token account which hold mSOL
    const mSOL_per_LP = mSOL_in_liq/mSOL_2Pool_supply;
    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["7HqhfUqig7kekN8FbJCtQ36VgdXKriZWQ62rTve9ZmQ", "11111111111111111111111111111111"]); //Mercurial mSOL-2Pool & system program
    result.forEach((row) => {
        if(dataMercurial[row.owner] == undefined){
            dataMercurial[row.owner] = row.amount*toUi*mSOL_per_LP;
        }else{
            dataMercurial[row.owner] += row.amount*toUi*mSOL_per_LP;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

function saber(){
    console.info(new Date().toISOString() + " Parsing Saber");

    const mSOL_SOL_supply = db.prepare(`SELECT supply FROM token_mint WHERE pubkey= ?`).all("SoLEao8wTzSfqhuou8rcYsVoLjthVmiXuEjzdNPMnCz")[0].supply*toUi; //Saber mSOL-SOL
    const mSOL_in_liq = db.prepare(`SELECT amount FROM token_account WHERE pubkey= ?`).all("9DgFSWkPDGijNKcLGbr3p5xoJbHsPgXUTr6QvGBJ5vGN")[0].amount*toUi; //Saber mSOL-SOL token account which hold mSOL
    const mSOL_per_LP = mSOL_in_liq/mSOL_SOL_supply;

    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["SoLEao8wTzSfqhuou8rcYsVoLjthVmiXuEjzdNPMnCz", "11111111111111111111111111111111"]); //Saber mSOL-SOL & system program
    result.forEach((row) => {
        if(dataSaber[row.owner] == undefined){
            dataSaber[row.owner] = row.amount*toUi*mSOL_per_LP;
        }else{
            dataSaber[row.owner] += row.amount*toUi*mSOL_per_LP;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

function friktion(){
    console.info(new Date().toISOString() + " Parsing Friktion");
    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["6UA3yn28XecAHLTwoCtjfzy3WcyQj1x13bxnH8urUiKt", "11111111111111111111111111111111"]); // fcmSOL address & system program address
    result.forEach((row) => {
        if(dataFriktion[row.owner] == undefined){
            dataFriktion[row.owner] = row.amount*toUi;
        }else{
            dataFriktion[row.owner] += row.amount*toUi;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

async function port(){
    console.info(new Date().toISOString() + " Parsing Port");

    const portData = await axios.get("https://api-v1.port.finance/collaterals/msol").then((response) => {
        const data = response.data;
        data.forEach((user) => {
            dataPort[user.owner] = Number(user.uiAmount);
            if(owners.indexOf(user.owner) == -1){
                owners.push(user.owner);
            }
        });
    });
}

function parseData(){
    owners.forEach((owner) => {
        data[owner] = {
            walletBalance : dataMSolHolders[owner] ? dataMSolHolders[owner] : 0,
            solendBalance : dataSolend[owner] ? dataSolend[owner] : 0,
            friktionBalance : dataFriktion[owner] ? dataFriktion[owner] : 0,
            raydiumV2Balance : dataRaydiumV2[owner] ? dataRaydiumV2[owner] : 0,
            portBalance : dataPort[owner] ? dataPort[owner] : 0,
            OrcaAquafarmsBalance : dataOrcaAquafarms[owner] ? dataOrcaAquafarms[owner] : 0,
            OrcaWhirlpoolBalance : dataOrcaWhirlpools[owner] ? dataOrcaWhirlpools[owner] : 0,
            TulipBalance : dataTulip[owner] ? dataTulip[owner] : 0,
            MercurialBalance : dataMercurial[owner] ? dataMercurial[owner] : 0,
            SaberBalance : dataSaber[owner] ? dataSaber[owner] : 0,
        }
    })
}

function createDbAndDump(){
    console.info(new Date().toISOString() + " Filling the DB");

    const db = new Database('msolData.db');
    db.exec(`CREATE TABLE data (
        owner VARCHAR(255),
        slot INT,
        wallet VARCHAR(255),
        solend DECIMAL(18, 9),
        friktion DECIMAL(18, 9),
        raydiumV2 DECIMAL(18, 9),
        port DECIMAL(18, 9),
        OrcaAquafarms DECIMAL(18, 9),
        OrcaWhirlpools DECIMAL(18, 9),
        Tulip DECIMAL(18, 9),
        Mercurial DECIMAL(18, 9),
        Saber DECIMAL(18, 9),
        total DECIMAL(18, 9)
    );`)

    const stmt = db.prepare(`INSERT INTO data VALUES (
        @owner,
        @slot,
        @wallet,
        @solend,
        @friktion,
        @raydiumV2,
        @port,
        @OrcaAquafarms,
        @OrcaWhirlpools,
        @Tulip,
        @Mercurial,
        @Saber,
        @total
    )`);

    owners.forEach((owner) => {
        stmt.run({
            owner: owner,
            slot: 0,
            wallet: data[owner].walletBalance,
            solend: data[owner].solendBalance,
            friktion: data[owner].friktionBalance,
            raydiumV2: data[owner].raydiumV2Balance,
            port: data[owner].portBalance,
            OrcaAquafarms: data[owner].OrcaAquafarmsBalance,
            OrcaWhirlpools: data[owner].OrcaWhirlpoolBalance,
            Tulip: data[owner].TulipBalance,
            Mercurial: data[owner].MercurialBalance,
            Saber: data[owner].SaberBalance,
            total: data[owner].walletBalance + data[owner].solendBalance + data[owner].friktionBalance + data[owner].raydiumV2Balance + data[owner].portBalance + data[owner].OrcaAquafarmsBalance + data[owner].OrcaWhirlpoolBalance + data[owner].TulipBalance + data[owner].MercurialBalance + data[owner].SaberBalance
        });
    })

    db.close();
}

function createJson(){
    console.log(new Date().toISOString() + " Creating JSON file");
    fs.writeFile('msolData.json',JSON.stringify(data, null, 2) , 'utf8', function (err) {
        if (err) throw err;
    });
}

// function to add a new protocol if the protocol give a collateral token to the user (ex: Friktion give fcmSOL to the user when staking mSOL)
// function TOKEN(){
//     console.info(new Date().toISOString() + " Parsing ProtocolName");
//     const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["TOKEN_MINT", "11111111111111111111111111111111"]); //TOKEN address & system program address
//     result.forEach((row) => {
//         if(dataProtocolName[row.owner] == undefined){
//             dataProtocolName[row.owner] = row.amount*toUi;
//         }else{
//             dataProtocolName[row.owner] += row.amount*toUi;
//         }

//         if(owners.indexOf(row.owner) == -1){
//             owners.push(row.owner);
//         }
//     });
// }


// function to add a new protocol if the protocol give a LP token to the user
// function LP(){
//     console.info(new Date().toISOString() + " Parsing ProtocolName");

//     const mSOL_tokenB_supply = db.prepare(`SELECT supply FROM token_mint WHERE pubkey= ?`).all("LP_TOKEN_MINT")[0].supply*toUi; //if the LP token have more or less than 9 decimals change the *toUi to Math.pow(10, NUMBER_OF_DECIMALS)
//     const mSOL_in_liq = db.prepare(`SELECT amount FROM token_account WHERE pubkey= ?`).all("TOKEN_ACCOUNT_WHICH_HOLD_MSOL")[0].amount*toUi; //mSOL-tokenB token account which hold mSOL
//     const mSOL_per_LP = mSOL_in_liq/mSOL_tokenB_supply;

//     const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["LP_TOKEN_MINT", "11111111111111111111111111111111"]); //mSOL-tokenB & system program
//     result.forEach((row) => {
//         if(dataProtocolName[row.owner] == undefined){
//             dataProtocolName[row.owner] = row.amount*toUi*mSOL_per_LP;
//         }else{
//             dataProtocolName[row.owner] += row.amount*toUi*mSOL_per_LP;
//         }

//         if(owners.indexOf(row.owner) == -1){
//             owners.push(row.owner);
//         }
//     });
// }


