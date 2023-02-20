const db = require('better-sqlite3')('./snapshot.db');
const toUi = Math.pow(10, -9);
var fs = require('fs');
const axios = require('axios');

var data = {}
var owners = []
var dataMarinadeQuarryBalance = []
var dataMSolHolders = []
var dataCMSolHolders = []
var dataFriktionHolders = []
var dataRaydiumV2Holders = []
var dataPortHolders = []
var dataOrcaAquafarmsHolders = []


async function main(){
    console.log("start");
    console.info(Date.now())
    await getMSolHolders();
    //await getMarinadeQuarryBalance();
    await getCMSolHolders();
    await getFriktionBalance();
    await getRaydiumV2Balance();
    await getPortBalance();
    await getOrcaAquafarmsBalance();
    parseData();
    fs.writeFile('data.json',JSON.stringify(data, null, 2) , 'utf8', function (err) {
        if (err) throw err;
        console.log('complete');
    });



    console.info(Date.now())
    console.log("end");
    closeDB();
}
main();

// async function getMarinadeQuarryBalance() {
//     const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? ORDER BY amount desc`).all(["mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "QMNeHCGYnLVDn1icRAfQZpjPLBNkfGbSKRB83G5d8KB"]);
//     result.forEach((row) => {
//         dataMarinadeQuarryBalance[row.owner] = row.amount*toUi;
//         if(owners.indexOf(row.owner) == -1){
//             owners.push(row.owner);
//         }
//     });
//     // result.forEach((row) => {
//     //     dataMSolHolders.push({amount : row.amount*toUi, owner: row.owner});
//     // });
// }

async function getMSolHolders() {
    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "11111111111111111111111111111111"]);
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


async function getCMSolHolders() {
    const result = db.prepare(`SELECT owner, deposit_amount FROM Solend ORDER BY deposit_amount desc`).all();

    result.forEach((row) => {
        if(dataCMSolHolders[row.owner] == undefined){
            dataCMSolHolders[row.owner] = row.deposit_amount*toUi;
        }else{
            dataCMSolHolders[row.owner] += row.deposit_amount*toUi;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });

}

async function getFriktionBalance(){
    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["6UA3yn28XecAHLTwoCtjfzy3WcyQj1x13bxnH8urUiKt", "11111111111111111111111111111111"]);
    result.forEach((row) => {
        if(dataFriktionHolders[row.owner] == undefined){
            dataFriktionHolders[row.owner] = row.amount*toUi;
        }else{
            dataFriktionHolders[row.owner] += row.amount*toUi;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

async function getOrcaAquafarmsBalance(){
    const mSOL_USDT_supply = db.prepare(`SELECT supply FROM token_mint WHERE pubkey= ?`).all("Afvh7TWfcT1E9eEEWJk17fPjnqk36hreTJJK5g3s4fm8")[0].supply*toUi;
    const mSOL_in_liq_USDT = db.prepare(`SELECT amount FROM token_account WHERE pubkey= ?`).all("RTXKRxghfWJpE344UG7UhKnCwN2Gyv6KnNSTFDnaASF")[0].amount*toUi;
    const mSOL_per_LP_USDT = mSOL_in_liq_USDT/mSOL_USDT_supply;
    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["Afvh7TWfcT1E9eEEWJk17fPjnqk36hreTJJK5g3s4fm8", "11111111111111111111111111111111"]);
    const resultDoubleDip = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["7iKG16aukdXXw43MowbfrGqXhAoYe51iVR9u2Nf2dCEY", "11111111111111111111111111111111"]);
    result.forEach((row) => {
        if(dataOrcaAquafarmsHolders[row.owner] == undefined){
            dataOrcaAquafarmsHolders[row.owner] = {mSOL_USDT: row.amount*toUi*mSOL_per_LP_USDT};
        }else{
            dataOrcaAquafarmsHolders[row.owner].mSOL_USDT += row.amount*toUi*mSOL_per_LP_USDT;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
    resultDoubleDip.forEach((row) => {
        if(dataOrcaAquafarmsHolders[row.owner] == undefined){
            dataOrcaAquafarmsHolders[row.owner] = {mSOL_USDT: row.amount*toUi};
        }else{
            dataOrcaAquafarmsHolders[row.owner].mSOL_USDT += row.amount*toUi;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

async function getRaydiumV2Balance(){
    const mSOL_USDC_supply = db.prepare(`SELECT supply FROM token_mint WHERE pubkey= ?`).all("4xTpJ4p76bAeggXoYywpCCNKfJspbuRzZ79R7pRhbqSf")[0].supply*toUi;
    const mSOL_in_liq_USDC = db.prepare(`SELECT amount FROM token_account WHERE pubkey= ?`).all("8JUjWjAyXTMB4ZXcV7nk3p6Gg1fWAAoSck7xekuyADKL")[0].amount*toUi;
    const mSOL_per_LP_USDC = mSOL_in_liq_USDC/mSOL_USDC_supply;
    const result = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["4xTpJ4p76bAeggXoYywpCCNKfJspbuRzZ79R7pRhbqSf", "11111111111111111111111111111111"]);
    result.forEach((row) => {
        if(dataRaydiumV2Holders[row.owner] == undefined){
            dataRaydiumV2Holders[row.owner] = {mSOL_USDC: row.amount*toUi*mSOL_per_LP_USDC, mSOL_SOL: 0};
        }else{
            dataRaydiumV2Holders[row.owner].mSOL_USDC += row.amount*toUi*mSOL_per_LP_USDC;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });

    const mSOL_SOL_supply = db.prepare(`SELECT supply FROM token_mint WHERE pubkey= ?`).all("5ijRoAHVgd5T5CNtK5KDRUBZ7Bffb69nktMj5n6ks6m4")[0].supply*toUi;
    const mSOL_in_liq_SOL = db.prepare(`SELECT amount FROM token_account WHERE pubkey= ?`).all("85SxT7AdDQvJg6pZLoDf7vPiuXLj5UYZLVVNWD1NjnFK")[0].amount*toUi;
    const mSOL_per_LP_SOL = mSOL_in_liq_SOL/mSOL_SOL_supply;
    const result2 = db.prepare(`SELECT token_account.owner, token_account.amount, account.pubkey FROM token_account, account WHERE token_account.mint= ? AND token_account.owner=account.pubkey AND account.owner= ? AND token_account.amount>0 ORDER BY token_account.amount desc`).all(["5ijRoAHVgd5T5CNtK5KDRUBZ7Bffb69nktMj5n6ks6m4", "11111111111111111111111111111111"]);
    result2.forEach((row) => {
        if(dataRaydiumV2Holders[row.owner] == undefined){
            dataRaydiumV2Holders[row.owner] = {mSOL_USDC: 0, mSOL_SOL: row.amount*toUi*mSOL_per_LP_SOL};
        }else{
            dataRaydiumV2Holders[row.owner].mSOL_SOL += row.amount*toUi*mSOL_per_LP_SOL;
        }

        if(owners.indexOf(row.owner) == -1){
            owners.push(row.owner);
        }
    });
}

async function getPortBalance(){
    const portData = await axios.get("https://api-v1.port.finance/collaterals/msol").then((response) => {
        const data = response.data;
        data.forEach((user) => {
            dataPortHolders[user.owner] = Number(user.uiAmount);
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
            marinadeQuarryBalance : dataMarinadeQuarryBalance[owner] ? dataMarinadeQuarryBalance[owner] : 0,
            solendBalance : dataCMSolHolders[owner] ? dataCMSolHolders[owner] : 0,
            friktionBalance : dataFriktionHolders[owner] ? dataFriktionHolders[owner] : 0,
            raydiumV2Balance : dataRaydiumV2Holders[owner] ? dataRaydiumV2Holders[owner] : {mSOL_USDC: 0, mSOL_SOL: 0},
            portBalance : dataPortHolders[owner] ? dataPortHolders[owner] : 0,
            OrcaAquafarmsBalance : dataOrcaAquafarmsHolders[owner] ? dataOrcaAquafarmsHolders[owner] : {mSOL_USDT: 0},
        }
    })
}

function closeDB() {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Close the database connection.');
    });
}

