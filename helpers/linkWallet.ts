// import { getUser, getUsersByWallet } from "../database/user";
import { bot } from "../bot/main";
import { getUser } from "../database/user";
import { createWallet, getUsersByWallet } from "../database/wallet";

import { disconnectWallet } from "./disconnectWallet";

export async function linkWallet(id, address, signature, signMessage) {
    const user = await getUser(id);
    if(!user) {
        throw "User not found";
    }
    const [wallet, created] = await createWallet(id, address, signature, signMessage);
    if(!created) {
        if(wallet.userId == id) {
            bot.sendMessage(id, `This wallet is already connected: \`${address}\``, { parse_mode: "markdown"});
            return false;
        }
        const anotherUser = await getUser(wallet.userId);
        --anotherUser.wallets;
        anotherUser.changed('wallets', true);
        await anotherUser.save();
        await disconnectWallet(wallet.userId, address, `Your wallet \`${address}\` has been connected by another user.`, true);

        
        wallet.userId = id;
        wallet.signature = signature;
        wallet.signMessage = signMessage;
        await wallet.save(); // We save the wallet, then we will go through all to exclude the attack method of the race condition
    }
    user.wallets++;
    await user.save();


    const usersByWallet = await getUsersByWallet(address);
    if(usersByWallet) {
        usersByWallet.map(async (userByWallet) => {
            if(userByWallet.userId != user.id) {
                await disconnectWallet(userByWallet.userId, userByWallet.address, "Your wallet \`${address}\` has been connected by another user.");
            }
        });
    }
    return true;
}