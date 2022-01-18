import { getUser } from "../../database/user";
import { getAllChatConfig } from "../../database/chat";
import { bot } from "../main";
import { noWalletMessage } from "./disconnectWallet";
import { getKeyboard } from "./getKeyboard";
import { updateBalance } from "../../helpers/updateBalance";
import { numWithCommas } from "../helpers/numWithCommas";
import { chatValidator } from "../helpers/groupValidator/main";


export async function checkAccessToGroup(msg) {
    if(msg.chat.type != 'private') {
        return;
    }
    const user = await getUser(msg.from.id);
    if(!user || !user.address) {
        return bot.sendMessage(msg.from.id, noWalletMessage, { reply_markup: getKeyboard(false) });
    }
    let message = await updateBalance(user.id, true);
    if(message == -1) {
        return;
    }
    await user.reload();

    let inviteLinks = [];
    let groups = await Promise.all((await getAllChatConfig()).map(async (chat) => {
        const config = JSON.parse(chat.config);
        let message = `*${chat.title}*\n`;
        let verdict = chatValidator(chat, user)
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
        bot.sendMessage(user.id, text, {
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: inviteLinks
            }
        });
    }
}