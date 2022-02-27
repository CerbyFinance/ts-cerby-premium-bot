import { getJoinedUsers, getUser, User } from "../database/user";
import { getUserWallets } from "../database/wallet";
import { getAllChatConfig, Chat } from "../database/chat";
import { updateBalance } from "./updateBalance";
import { chatValidator } from "../bot/helpers/groupValidator/main";
import { kickChatMember } from "./kickuser";
import { bot } from "../bot/main";
import { superUserErrorHandler } from "./superUserErrorHandler";

const maxTime = 60 * 60 * 1e3; // 60 minutes
const maxAwait = 1000 * 1e3; // 10 seconds


export async function startBalanceChecker() {
    const users = await getJoinedUsers();
    const allChatConfig = await getAllChatConfig();
    const allGroups = {};
    allChatConfig.forEach((chat) => {
        allGroups[chat.id] = chat;
    });
    const startTime = Date.now();

    for(let i = 0; i < users.length; i++) {
        let user = users[i];
        try {
            await userBalanceCheck(user, allGroups);
        } catch(err) {
            const errorMessage = "Current balance checker instance is stopped";
            superUserErrorHandler(errorMessage);
            superUserErrorHandler(err);
            console.error(err);
            break;
        }
        if(users.length - 1 != i) {
            const averageTime = (Date.now() - startTime) / i;
            const timeLeft = (startTime + maxTime) - Date.now();
            const awaitTime = (timeLeft / users.length) - averageTime;
            await new Promise((resolve) => { setTimeout(resolve, awaitTime > maxAwait ? maxAwait : awaitTime) });
        }
    }

    const timeLeft = (startTime + maxTime) - Date.now();
    console.log(`The balance check procedure is completed. Waiting for next: ${Math.ceil(timeLeft / 1000)} seconds`);
    setTimeout(startBalanceChecker, timeLeft)
    return;
}

export async function userBalanceCheck(user: number | User, allGroups?: {[key: number]: Chat}, attempt = 0) {
    if(typeof user == 'number') {
        user = await getUser(user)
    }
    if((!user.joinedGroups || !user.joinedGroups.length) && !user.notification) {
        return;
    }
    if(!allGroups) {
        const allChatConfig = await getAllChatConfig();
        allGroups = {};
        allChatConfig.forEach((chat) => {
            allGroups[chat.id] = chat;
        });
    }

    const startUpdateTime = Date.now()
    let message = await updateBalance(user.id, false, true);
    if(message == -1) {
        throw "Update Balance returned -1";
    }
    let updateTime = Date.now() - startUpdateTime;
    console.log(`User(${user.id} ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}) balance updated with ${updateTime / 1e3} seconds`);

    const wallets = await getUserWallets(user.id)
    let amountBalance = {
        cerby: 0,
        usd: 0
    }
    wallets.forEach((wallet) => {
        const walletBalance = JSON.parse(wallet.balance);
        amountBalance.cerby += walletBalance.cerby || 0;
        amountBalance.usd += walletBalance.usd || 0;
    });

    if(user.joinedGroups) {
        const joinedGroups = user.joinedGroups;
        for(let chatIndex = 0; chatIndex < joinedGroups.length; chatIndex++) {
            const chat = joinedGroups[chatIndex];
            console.log(chat);
            const verdict = chatValidator(allGroups[chat], amountBalance);
            if(!verdict.allowed) {
                if(attempt < 5) {
                    await userBalanceCheck(user, allGroups, ++attempt);
                } else {
                    user.joinedGroups.splice(chatIndex, 1);
                    user.changed("joinedGroups", true);
                    await user.save();
                    await kickChatMember(chat, user.id, `❌ [${user.first_name}${user.last_name ? ' ' + user.last_name : ''}](tg://user?id=${user.id}) was kicked due to having not enough CERBY's!`);
                    await bot.sendMessage(user.id, `❌ You have been excluded from the ${allGroups[chat].title} chat.\n` +
                                                    `*Cause:* ${verdict.comment}`, { parse_mode: "markdown" });
                }
            }
        }
    }
}