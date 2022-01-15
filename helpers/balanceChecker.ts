import { getJoinedUsers } from "../database/user";
import { getAllChatConfig } from "../database/chat";
import { updateBalance } from "./updateBalance";
import { chatValidator } from "../bot/helpers/groupValidator/main";
import { kickChatMember } from "./kickuser";
import { bot } from "../bot/main";

const maxTime = 15 * 60 * 1e3; // 15 minutes
const maxAwait = 20 * 60; // 20 seconds


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
        const startUpdateTime = Date.now()
        await updateBalance(user.id, false, true);
        let updateTime = Date.now() - startUpdateTime;
        console.log(`User(${user.id} ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}) balance updated with ${updateTime / 1e3} seconds`);
        await user.reload();
        const joinedGroups = user.joinedGroups;
        for(let chatIndex = 0; chatIndex < joinedGroups.length; chatIndex++) {
            const chat = joinedGroups[chatIndex];
            const verdict = chatValidator(allGroups[chat], user);
            if(!verdict.allowed) {
                user.joinedGroups.splice(chatIndex, 1);
                user.changed("joinedGroups", true);
                await user.save();
                await kickChatMember(chat, user.id, `❌ ${user.first_name}${user.last_name ? ' ' + user.last_name : ''} was kicked due to having not enough CERBY's!`);
                await bot.sendMessage(user.id, `❌ You have been excluded from the ${allGroups[chat].title} chat.\n` +
                                              `*Cause:* ${verdict.comment}`, { parse_mode: "markdown" });
            }
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