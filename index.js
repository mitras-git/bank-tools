#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/.env' });
const minimist = require('minimist');
const express = require('express');
const bodyParser = require("body-parser");
let { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const {data} = require("express-session/session/cookie");
const app = express();

const args = minimist(process.argv.slice(2));

if (args.help || args.h) {
    console.log('Usage: pnc-tools [options]');
    console.log('Options:');
    console.log('  -txn, --transaction    Show all transactions');
    console.log('  -bal, --balances       Shows balances');
    process.exit(0);
}

let showTransactions = args.txn || args.transaction;
let showBalances = !showTransactions; // Default to showing balances if no transaction flag is set

if (args.bal || args.balances) {
    showBalances = true; // Show balances if the balance flag is explicitly set
}

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    const configuration = new Configuration({
        basePath: PlaidEnvironments.development,
        baseOptions: {
            headers: {
                'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
                'PLAID-SECRET': process.env.PLAID_SECRET,
            },
        },
    });

    const client = new PlaidApi(configuration);

    const requestForBalance = {
        access_token: process.env.ACCESS_TOKEN,
    };

    let cursor = null;

    const requestForTransactions = TransactionsSyncRequest = {
        access_token: process.env.ACCESS_TOKEN,
        cursor: cursor,
    };

    async function getTransactions() {
        try {
            const response = await client.transactionsSync(requestForTransactions);
            const data = response.data.added;
            const transactions = data.map((transaction) => {
                return {
                    date: transaction.date,
                    name: transaction.name,
                    amount: transaction.amount,
                    location: transaction.location.region,
                    type: transaction.transaction_type,
                };
            });
            console.log(transactions);
        } catch (error) {
            console.error(error);
        }
    }

    async function getAccountBalances() {
        try {
            const response = await client.accountsBalanceGet(requestForBalance);
            const accounts = response.data.accounts;
            console.log(accounts);
            const balances = accounts.map((account) => {
                return {
                    name: account.name,
                    balance: account.balances.current,
                };
            });
            console.log(balances);
        } catch (error) {
            console.error(error);
        }
    }

    (async () => {
        if (showTransactions) {
            await getTransactions();
        }
        if (showBalances) { // This will now only run if showBalances is true
            await getAccountBalances();
        }
    })();


