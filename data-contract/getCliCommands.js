'use strict';

const fs = require('fs');

const inputFile = 'certs.json';
const outputFile = 'cli.txt';

/**
 * This is just a temporary tool that can help for when we want to delete certs from mainnet before launch.
 * Steps:
 * 1. For each account whose certs you want to delete, call `NEAR_ENV=mainnet near view certificates.unv.near nft_tokens_for_owner '{"account_id": "xxxxx.near"}' > xxxxx.json`
 * 2. For each of those JSON files, delete the first line, then use http://www.relaxedjson.org/docs/converter.html to convert to a strict JSON array.
 * 3. Consolidate all of the items of those different JSON files into one array in a combined file called certs.json.
 * 4. Run this script: `node getCliCommands.js`
 * 5. Copy the contents of the file called cli.txt into the command line.
 */



const contents = fs.readFileSync(inputFile);
const certs = JSON.parse(contents);
// console.log(certs);
const tokenIds = certs.map(cert => cert.token_id);
console.log(tokenIds.length, { tokenIds })

let lines = '';

certs.forEach(cert => { 
    lines = lines + `NEAR_ENV=mainnet near call certificates.unv.near cert_delete '{ "token_id": "${cert.token_id}"}' --account-id ryancwalsh.near --depositYocto 1 --gas 300000000000000\n`;
});

// https://stackabuse.com/reading-and-writing-json-files-with-node-js/

fs.writeFileSync(outputFile, lines, (err) => {
    if (err) throw err;
    console.log(`${outputFile} has been saved!`);
});