import { bot } from "../bot/main";

export async function checkPermissions(chatId, userId) {
    try {
        const admins = (await bot.getChatAdministrators(chatId)).map((admin) => admin.user.id)
        return Boolean(~admins.indexOf(userId));
    } catch(err) {
        console.error(err);
        return false;
    }
}