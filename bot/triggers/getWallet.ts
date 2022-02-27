import { getUser } from "../../database/user";
import { bot } from "../main";
import { numWithCommas } from "../helpers/numWithCommas";
import { updateBalance } from "../../helpers/updateBalance";
import { getKeyboard } from "./getKeyboard";
import { checkAccessToGroup } from "./checkGroup";
import { noWalletMessage } from "./disconnectWallet";
import { getUserWallets } from "../../database/wallet";

export async function getWallet(id: number, newWallet?: string) {
    const wallets = await getUserWallets(id);
    if(!wallets.length) {
        const user = await getUser(id);
        if(user) {
            user.wallets = 0;
            user.save();
        }
        return bot.sendMessage(id, noWalletMessage, { parse_mode: "markdown", reply_markup: getKeyboard(user.wallets) })
    }
    if(newWallet) {
        await bot.sendMessage(id, `*Wallet connected:* \`${newWallet}\``, { parse_mode: "markdown", reply_markup: getKeyboard(wallets.length) });
    }
    let message = await updateBalance(id, true);
    if(message == -1) {
        return;
    }
    await Promise.all(wallets.map(wallet => wallet.reload()))

    let text = '';
    if(wallets.length == 1) {
        const wallet = wallets[0];
        const walletBalance = JSON.parse(wallet.balance)


        text = `*Your wallet:* \`${wallet.address}\`\n` +
               `*Balance:* ${numWithCommas(walletBalance.cerby || 0)} CERBY (${numWithCommas(walletBalance.usd || 0)} USD)\n\n`
                + chainInfo(walletBalance)
    } else {
        let amountBalance = {
            cerby: 0,
            usd: 0
        }
        text += `*Your wallets:*\n`;
        wallets.forEach((wallet) => {
            const walletBalance = JSON.parse(wallet.balance);
            amountBalance.cerby += walletBalance.cerby || 0;
            amountBalance.usd += walletBalance.usd || 0;
            text += `*${shortenAddress(wallet.address)}*: ${numWithCommas(walletBalance.cerby || 0)} CERBY (${numWithCommas(walletBalance.usd || 0)} USD)\n${chainInfo(walletBalance)}\n`
        })
        text += `*Amount of balances:* ${numWithCommas(amountBalance.cerby || 0)} CERBY (${numWithCommas(amountBalance.usd || 0)} USD)`
    }
    if(message) {
        bot.editMessageText(text, { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "markdown" });
    } else {
        bot.sendMessage(id, text, { parse_mode: "markdown", reply_markup: getKeyboard(wallets.length) });
    }
    if(newWallet) {
        checkAccessToGroup({
            chat: {
                type: 'private'
            },
            from: {
                id
            }
        })
    }
}


export function shortenAddress(address) {
    return address.substring(0, 6) + "..." + address.substring(address.length - 4);
}


export function chainInfo(walletBalance) {
    let additionalWalletInfo = '';
    Object.keys(walletBalance).filter(v => walletBalance[v] instanceof Object).forEach((chain) => {
        if(walletBalance[chain].liquid || walletBalance[chain].staked) {
            additionalWalletInfo += `*${chain.length > 3 ? chain : chain.toUpperCase()}:* ${numWithCommas(Math.floor(walletBalance[chain].liquid || 0))} CERBY (${numWithCommas(Math.floor(walletBalance[chain].liquidInUsd || 0))} USD), Staked: ${numWithCommas(Math.floor(walletBalance[chain].staked || 0))} CERBY (${numWithCommas(Math.floor(walletBalance[chain].stakedInUsd || 0))} USD)\n`;
        }
    });
    return additionalWalletInfo;
}