import { bot } from "../bot/main";
import { getUser } from "../database/user";
import { getUserWallets, getWallet } from "../database/wallet";
import { getKeyboard } from "../bot/triggers/getKeyboard";
import { kickChatMember } from "./kickuser";
import { userBalanceCheck } from "./balanceChecker";

export async function disconnectWallet(userId: number, walletAddress?: string, message?: string, justNotify = false) {
    let user = await getUser(userId);
    if(!justNotify && walletAddress) {
        let wallet = await getWallet(walletAddress);
        if(wallet && wallet.userId == user.id) {
            wallet.destroy();
            if(user.wallets && user.wallets > 0) {
                user.wallets--;
            } else {
                user.wallets = 0;
            }
        }
    } else if(!justNotify && !walletAddress) {
        const wallets = await getUserWallets(userId);
        user.wallets = 0;
        await Promise.all([...wallets.map(wallet => wallet.destroy()), user.save()])
    }
    if(!user.wallets) {
        if(user.joinedGroups) {
            user.joinedGroups.forEach((chat) => {
                kickChatMember(chat, user.id, `❌ [${user.first_name}${user.last_name ? ' ' + user.last_name : ''}](tg://user?id=${user.id}) was kicked out due to disconnected wallet.`)
            })
            user.joinedGroups = [];
        }
    } else {
        userBalanceCheck(user);
    }
    await user.save();

    if(message) {
        await bot.sendMessage(user.id, message, { parse_mode: "markdown", reply_markup: getKeyboard(user.wallets) });
    }
    bot.sendMessage(user.id, `You can connect the wallet back using the *${user.wallets ? "Settings –> Connect another wallet" : "Connect wallet"}* button`, { parse_mode: "markdown", reply_markup: getKeyboard(user.wallets) });
}