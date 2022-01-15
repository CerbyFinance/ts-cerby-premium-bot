import { bot } from "../bot/main";

export async function kickChatMember(chat: number, id: number, message?) {
    await bot.banChatMember(chat, id, { until_date: Date.now() / 1e3 + 90 })
    if(message) {
        bot.sendMessage(chat, message, { parse_mode: "markdown" });
    }
}