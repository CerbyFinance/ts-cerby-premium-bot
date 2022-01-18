import { getUser } from "../../database/user";
import { bot } from "../main";
import { numWithCommas } from "../helpers/numWithCommas";
import { updateBalance } from "../../helpers/updateBalance";
import { getKeyboard } from "./getKeyboard";
import { checkAccessToGroup } from "./checkGroup";
import { noWalletMessage } from "./disconnectWallet";

export async function getWallet(id: number, newWallet?: boolean) {
    const user = await getUser(id);
    if(!user || !user.address) {
        return bot.sendMessage(id, noWalletMessage, { parse_mode: "markdown", reply_markup: getKeyboard(false) })
    }
    if(newWallet) {
        let { address } = user;
        await bot.sendMessage(id, `*Wallet connected:* \`${address}\``, { parse_mode: "markdown", reply_markup: getKeyboard(true) });
    }
    let message = await updateBalance(id, true);
    if(message == -1) {
        return;
    }
    await user.reload()
    const text = `*Your wallet:* \`${user.address}\`\n` +
                 `*Balance:* ${numWithCommas(user.cerby || 0)} CERBY (${numWithCommas(user.usd || 0)} USD)`
    if(message) {
        bot.editMessageText(text, { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "markdown" });
    } else {
        bot.sendMessage(user.id, text, { parse_mode: "markdown", reply_markup: getKeyboard(true) });
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