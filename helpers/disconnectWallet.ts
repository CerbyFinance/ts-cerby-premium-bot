import { bot } from "../bot/main";
import { getUser } from "../database/user";
import { getKeyboard } from "../bot/triggers/getKeyboard";
import { kickChatMember } from "./kickuser";

export async function disconnectWallet(id, message?: string) {
    let user = await getUser(id);
    user.address = null;
    user.cerby = null;
    user.usd = null;
    user.signMessage = null;
    user.signature = null;
    user.balanceUpdatedAt = null;
    if(user.joinedGroups) {
        user.joinedGroups.forEach((chat) => {
            kickChatMember(chat, user.id, `❌ [${user.first_name}${user.last_name ? ' ' + user.last_name : ''}](tg://user?id=${id}) was kicked out due to disconnected wallet.`)
        })
        user.joinedGroups = [];
    }
    await user.save();

    if(message) {
        await bot.sendMessage(id, message, { parse_mode: "markdown", reply_markup: getKeyboard(false) });
    }
    bot.sendMessage(id, `You can connect the wallet back using the *Connect wallet* button`, { parse_mode: "markdown", reply_markup: getKeyboard(false) });
}