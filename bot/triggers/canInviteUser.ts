import { getChat } from "../../database/chat";
import { getUser } from '../../database/user';
import { getUserWallets } from "../../database/wallet";
import { chatValidator } from "../helpers/groupValidator/main";
import { bot } from "../main";
import { getKeyboard } from './getKeyboard';

export async function canInviteUser(ctx) {
    const chat = await getChat(ctx.chat.id);
    if(!chat) {
        return;
    }
    const user = await getUser(ctx.from.id);
    const wallets = await getUserWallets(ctx.from.id);
    if(user && user.wallets && wallets.length) {
        let amountBalance = {
            cerby: 0,
            usd: 0
        }
        wallets.forEach((wallet) => {
            const walletBalance = JSON.parse(wallet.balance);
            amountBalance.cerby += walletBalance.cerby || 0;
            amountBalance.usd += walletBalance.usd || 0;
        })
        const verdict = chatValidator(chat, amountBalance);
        if(verdict.allowed) {
            bot.approveChatJoinRequest(chat.id, user.id);
            bot.sendMessage(chat.id, `👋 [${user.first_name}${user.last_name ? ' ' + user.last_name : ''}](tg://user?id=${user.id}), Welcome to ${chat.title}!`, { parse_mode: "markdown" })
            if(!(user.joinedGroups instanceof Array)) {
                user.joinedGroups = [];
            }
            if(!user.joinedGroups.includes(chat.id)) {
                user.joinedGroups.push(chat.id);
            }
            user.changed('joinedGroups', true);
            return await user.save()
        } else {
            bot.sendMessage(user.id, `You have applied to join the "${chat.title}". Your join request has been rejected because you do not qualify.\n*Cause:* ${verdict.comment}`, { reply_markup: getKeyboard(user.wallets), parse_mode: "markdown" })
        }
    } else {
        bot.sendMessage(ctx.from.id, `You have applied to join the "${chat.title}". To do this, you need to authorize your wallet.`, { reply_markup: getKeyboard(user.wallets) })
    }

    return bot.declineChatJoinRequest(ctx.chat.id, ctx.from.id);
}