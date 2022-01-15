import { request } from "./request";

const stakingUrls = {
    Eth: "https://graph.cerby.fi/subgraphs/name/cerby/staking-ethereum",
    Fantom: "https://graph.cerby.fi/subgraphs/name/cerby/staking-fantom",
    Avalanche: "https://graph.cerby.fi/subgraphs/name/cerby/staking-avalanche",
    Bsc: "https://graph.cerby.fi/subgraphs/name/deft/staking-binance",
    Polygon: "https://graph.cerby.fi/subgraphs/name/deft/staking-polygon"
}

const scanApi = {
    Fantom: { url: "https://api.ftmscan.com/api", apiKey: "9GDIQ5D76VTARPNN2E4P7QIKGX5X869YNZ" },
    Avalanche: { url: "https://api.snowtrace.io/api", apiKey: "UGET8JS8SIM16DEM4MJVTCQD5KFZWG4GXQ" },
    Eth: { url: "https://api.etherscan.io/api", apiKey: "1VWGQK47AT68RDXFYU3Q3B1FM2H8QP5B1Q" },
    Bsc: { url: "https://api.bscscan.com/api", apiKey: "2TKHPD8XK7PNXN43J7BJMDHCPZ54D5P7SJ" },
    Polygon: { url: "https://api.polygonscan.com/api", apiKey: "61MFU8G6RPMDJRZSYHR3EGKYQG2YINVTPY" }
}


export async function getAmount(address: string) {
    const prices = (await request("GET", "https://supply.cerby.fi/cerby/supply-marketcap")).data;
    let staking = {};
    let liquid = {};
    let stakingPromises = Object.keys(stakingUrls).map(async (stakingSymbol) => {
        let tempReceived = await request("POST", stakingUrls[stakingSymbol], { query: getStakedAmountQuery(address) });
        if(tempReceived['errors']) {
            console.error(tempReceived.errors);
            return;
        }
        if(tempReceived.data.user != null) {
            staking[stakingSymbol] = {
                staked: +tempReceived.data.user.stakedAmount,
                stakedInUsd: +tempReceived.data.user.stakedAmount * +prices[`priceOn${stakingSymbol}`]
            }
        }
    });
    let liquidPromises = Object.keys(scanApi).map(async (scan) => {
        let tempReceived = await request("GET", scanApi[scan].url, { params:
            { module: "account",
              action: "tokenbalance",
              contractaddress: "0xdef1fac7bf08f173d286bbbdcbeeade695129840",
              address,
              tag: "latest",
              apikey: scanApi[scan].apiKey
            }
        });
        if(tempReceived.message != "OK") {
            console.error(tempReceived);
        }
        liquid[scan] = {
            liquid: tempReceived.result / 1e18,
            liquidInUsd: tempReceived.result / 1e18 * +prices[`priceOn${scan}`]
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
        }
      }`.split(/ |\n/gm).filter(el => el).join(' ');
}