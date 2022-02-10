import { getUser } from "../../database/user";
import { getAllChatConfig } from "../../database/chat";
import { bot } from "../main";
import { noWalletMessage } from "./disconnectWallet";
import { getKeyboard } from "./getKeyboard";
import { updateBalance } from "../../helpers/updateBalance";
import { numWithCommas } from "../helpers/numWithCommas";
import { chatValidator } from "../helpers/groupValidator/main";
import { getUserWallets } from "../../database/wallet";


export async function checkAccessToGroup(msg) {
    if(msg.chat.type != 'private') {
        return;
    }
    const wallets = await getUserWallets(msg.from.id)
    if(!wallets.length) {
        return bot.sendMessage(msg.from.id, noWalletMessage, { reply_markup: getKeyboard(wallets.length) });
    }
    let message = await updateBalance(msg.from.id, true);
    if(message == -1) {
        return;
    }
    await Promise.all(wallets.map(wallet => wallet.reload()));

    let amountBalance = {
        cerby: 0,
        usd: 0
    }

    wallets.forEach((wallet) => {
        const walletBalance = JSON.parse(wallet.balance);
        amountBalance.cerby += walletBalance.cerby || 0;
        amountBalance.usd += walletBalance.usd || 0;
    });

    let inviteLinks = [];
    let groups = await Promise.all((await getAllChatConfig()).map(async (chat) => {
        const config = JSON.parse(chat.config);
        let message = `*${chat.title}*\n`;
        let verdict = chatValidator(chat, amountBalance)
        if(chat.type == "minBalance") {
            message += `*Minimum balance for join:* ${numWithCommas(config.minBalance)}${!verdict.allowed ? ` (${verdict.percent.toFixed(1)}% you already have)` : ''}\n`;
        }
        if(verdict.allowed) {
            message += '*Access is allowed*';
            inviteLinks.push([{
                text: chat.title,
                url: chat.inviteLink
            }]);
        } else {
            message += `*Cause:* ${verdict.comment}\n*You cannot join the group*`
        }
        return message;
    }));
    let text = `Available premium groups\n\n` + groups.join('\n\n');
    if(message) {
        console.log(message);
        bot.editMessageText(text, {
            chat_id: message.chat.id,
            message_id: message.message_id,
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: inviteLinks
            }
     });
    } else {
        bot.sendMessage(msg.from.id, text, {
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: inviteLinks
            }
        });
    }
}