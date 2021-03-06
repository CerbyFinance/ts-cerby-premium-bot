import { getUser } from "../database/user";
import { getAmount } from "./getAmount";
import { bot } from "../bot/main";
import { superUserErrorHandler } from "./superUserErrorHandler";
import { getUserWallets } from "../database/wallet";
import { numWithCommas } from "../bot/helpers/numWithCommas";

const walletBalanceUpdateTime = 60000;

export async function updateBalance(id: number, userRequest = false, force = false): Promise<userMessage | -1 | void> {
    const user = await getUser(id);
    let message;
    const wallets = await getUserWallets(id);
    user.wallets = wallets.length;
    user.save();
    if(userRequest && wallets.filter(wallet => +wallet.balanceUpdatedAt + walletBalanceUpdateTime < Date.now()).length) {
        message = bot.sendMessage(id, "🕖 Updating balance...", { parse_mode: "markdown" });
    }
    const nowTime = Date.now();
    const _walletsPromise = await Promise.all(wallets.map(async (wallet) => {
        if(wallet.address && (+wallet.balanceUpdatedAt + walletBalanceUpdateTime < nowTime || force)) {
            try {
                const amount = await getAmount(wallet.address, userRequest);
                if(user.notification) {
                    // let currentStakes = {}
                    const walletBalance = JSON.parse(wallet.balance);
                    Object.keys(amount).filter(v => amount[v] instanceof Object).forEach((chain) => {
                        if(amount[chain].stakes) {
                            Object.keys(amount[chain].stakes).forEach((stakeId) => {
                                if(walletBalance && walletBalance[chain].stakes) {
                                    amount[chain].stakes[stakeId] = Object.assign(amount[chain].stakes[stakeId], walletBalance[chain].stakes[stakeId]);
                                }
                                const startDay = +amount[chain].stakes[stakeId].startDay,
                                    lockDays = +amount[chain].stakes[stakeId].lockDays,
                                    completedDate = 1635465600000 + (startDay + lockDays) * 0x5265c00;
                                const additionalText = `*Wallet:* \`${wallet.address}\`\n` +
                                                    `*Chain:* ${chain.length == 3 ? chain.toUpperCase() : chain}\n` +
                                                    `*Amount staked:* ${numWithCommas(amount[chain].stakes[stakeId].stakedAmount)} CERBY`
                                if(completedDate > nowTime - 0x5265c00 && completedDate < nowTime + 0x5265c00 && !amount[chain].stakes[stakeId].notify24h) {
                                    amount[chain].stakes[stakeId].notify24h = true;
                                    bot.sendMessage(user.id, `⏰ Your stake (ID: ${stakeId}) will be *matured in 24 hours!*\n` + additionalText,
                                                    { parse_mode: "markdown" });
                                }
                                if(completedDate <= nowTime && !amount[chain].stakes[stakeId].notified) {
                                    amount[chain].stakes[stakeId].notified = true;
                                    bot.sendMessage(user.id, `⏰ Your stake (ID: ${stakeId}) *has matured*! Consider ending the stake asap to avoid penalties: https://app.cerby.fi/\n` + additionalText,
                                                    { parse_mode: "markdown" });
                                    
                                }
                                if(completedDate <= nowTime && amount[chain].stakes[stakeId].notify7day < nowTime - 0x240c8400) {
                                    amount[chain].stakes[stakeId].notify7day = nowTime;
                                    bot.sendMessage(user.id, `⏰ Your stake (ID: ${stakeId}) *was matured 7 days ago!* Consider ending the stake asap to avoid penalties: https://app.cerby.fi/\n` + additionalText,
                                                    { parse_mode: "markdown" });
                                }
                            })
                        }
                    })
                }

                console.log(amount);
                wallet.balance = JSON.stringify({
                    ...amount,
                    cerby: Math.floor(amount.amountLiquid + amount.amountStaked),
                    usd: Math.floor(amount.amountLiquidInUsd + amount.amountStakedInUsd)
                    // stakes: 
                })
                // user.cerby = Math.floor(amount.amountLiquid + amount.amountStaked);
                // user.usd = Math.floor(amount.amountLiquidInUsd + amount.amountStakedInUsd);
                wallet.balanceUpdatedAt = new Date();

                await wallet.save();
            } catch(err) {
                console.error(err);
                superUserErrorHandler(err);
                if(userRequest) {
                    message = await message;
                    bot.editMessageText("There was a problem with the bot. We are trying to resolve it as quickly as possible. Please try again later.", { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "markdown" });
                }
                return -1;
            }
        } else {
            return;
        }
    }));
    if(_walletsPromise.includes(-1)) {
        return -1;
    }
    
    if(userRequest) {
        return message;
    }
}