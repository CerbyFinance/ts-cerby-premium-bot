import { bot } from "../bot/main";
import { checkPermissions } from "./checkPermissions";
import { superUserErrorHandler } from "./superUserErrorHandler";

export async function kickChatMember(chat: number, id: number, message?) {
    const permissions = await checkPermissions(chat, id);
    if(!permissions) {
        try {
            await bot.banChatMember(chat, id, { until_date: Date.now() / 1e3 + 90 })
            if(message) {
                bot.sendMessage(chat, message, { parse_mode: "markdown" });
            }
        } catch(err) {
            superUserErrorHandler(`Error: Failed to kick the user(${id}) out of the group. Chat: ${chat}\nCause: ${message}\nErr: ${err}`)

        }
    } else {
        superUserErrorHandler(`Warning: The user(${id}) has disabled his wallet and is an administrator in the group.\nCause: ${message}`)
    }
}