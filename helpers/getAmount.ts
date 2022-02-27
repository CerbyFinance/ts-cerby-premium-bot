import { request } from "./request";
import { AbiItem } from 'web3-utils';
import { nextTick } from "process";
import { GeneratedIdentifierFlags } from "typescript";
import { addQueue } from "./amountQueue";
const Web3 = require('web3');

const stakingUrls = {
    Eth: "https://graph.cerby.fi/subgraphs/name/cerby/staking-ethereum",
    Fantom: "https://graph.cerby.fi/subgraphs/name/cerby/staking-fantom",
    Avalanche: "https://graph.cerby.fi/subgraphs/name/cerby/staking-avalanche",
    Bsc: "https://graph.cerby.fi/subgraphs/name/deft/staking-binance",
    Polygon: "https://graph.cerby.fi/subgraphs/name/deft/staking-polygon"
}

const minABI = [{
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      type: "function",
    },] as AbiItem[]

const tokenAddress = "0xdef1fac7bf08f173d286bbbdcbeeade695129840";

const Rpcs = {
    Fantom:    new (new Web3("https://secret:X4gDeGtfQy2M@fantom-node.cerby.fi")).eth.Contract(minABI, tokenAddress),
    Avalanche: new (new Web3("https://secret:X4gDeGtfQy2M@avalanche-node.cerby.fi")).eth.Contract(minABI, tokenAddress),
    Eth:       new (new Web3("https://secret:X4gDeGtfQy2M@eth-node.cerby.fi")).eth.Contract(minABI, tokenAddress),
    Bsc:       new (new Web3("https://secret:X4gDeGtfQy2M@bsc-node.cerby.fi")).eth.Contract(minABI, tokenAddress),
    Polygon:   new (new Web3("https://secret:X4gDeGtfQy2M@polygon-node.cerby.fi")).eth.Contract(minABI, tokenAddress)
}


export async function getAmount(address: string, userRequest=false) {
    const prices = (await request("GET", "https://supply.cerby.fi/cerby/supply-marketcap")).data;
    let staking = {};
    let liquid = {};
    let stakingPromises = Object.keys(stakingUrls).map(async (stakingSymbol) => {
        let latestError;
        for(let z = 0; z < 15; z++) {
            let tempReceived = await request("POST", stakingUrls[stakingSymbol], { query: getStakedAmountQuery(address) });
            if(tempReceived['errors']) {
                console.error(tempReceived.errors);
                latestError = tempReceived.errors;
                await new Promise((r) => setTimeout(r, 3000));
                continue;
            }
            if(tempReceived.data.user != null) {
                staking[stakingSymbol] = {
                    staked: +tempReceived.data.user.stakedAmount,
                    stakedInUsd: +tempReceived.data.user.stakedAmount * +prices[`priceOn${stakingSymbol}`],
                    stakes: {}
                }
                if(tempReceived.data.user.stakes) {
                    tempReceived.data.user.stakes.forEach((stake) => {
                        staking[stakingSymbol].stakes[stake.id] = stake;
                    })
                }
                return;
            } else if(tempReceived.data.user == null) {
                return;
            } else {
                console.log("Maybe chain was recogniezed", address)
                console.log(tempReceived.data)
                await new Promise((r) => setTimeout(r, 3000));
                continue;
            }
        }
        throw `There have already been 15 attempts to get the stake balance. Chain: ${stakingSymbol}, user: ${address}. Error: ${JSON.stringify(latestError)}`;
    });
    let liquidPromises = Object.keys(Rpcs).map(async (rpc) => {
        for(let attempt = 0; attempt <= 5; attempt++) {
            try {
                const balance: number = await addQueue(rpc, Rpcs[rpc].methods.balanceOf(address).call, userRequest);

                liquid[rpc] = {
                    liquid: balance / 1e18,
                    liquidInUsd: balance / 1e18 * +prices[`priceOn${rpc}`]
                }
                break;
            } catch(err) {
                if(attempt == 5) {
                    throw `There have already been more than 5 attempts to get a balance, which ended in an error. Chain: ${rpc}\n\n${err}`
                }
                await new Promise((r) => setTimeout(r, 5000));
            }
        }
    })
    await Promise.all(stakingPromises);
    await Promise.all(liquidPromises);
    let response = {};
    let amount = {amountLiquid: 0, amountLiquidInUsd: 0, amountStaked: 0, amountStakedInUsd: 0};
    Object.keys(liquid).forEach((chain) => {
        response[chain] = Object.assign(liquid[chain], staking[chain] || {});
        if(liquid[chain] && Object.keys(liquid[chain]).length) {
            amount.amountLiquid += +liquid[chain].liquid;
            amount.amountLiquidInUsd += +liquid[chain].liquidInUsd;
        }
        if(staking[chain] && Object.keys(staking[chain]).length) {
            amount.amountStaked += +staking[chain].staked;
            amount.amountStakedInUsd += +staking[chain].stakedInUsd;
        }
    });
    return Object.assign(response, amount);
}


function getStakedAmountQuery(address) {
    return `query {
        user(id: "${address.toLowerCase()}") {
            stakedAmount
            stakes(first: 1000, orderBy: id, where: { completedAt: null, canceledAt: null }) {
                id
                stakedAmount
                lockDays
                startDay
                completedAt
                canceledAt
                blockNumber
            }
        }
      }`.split(/ |\n/gm).filter(el => el).join(' ');
}