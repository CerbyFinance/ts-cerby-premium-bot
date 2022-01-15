import { getChat } from "../../database/chat";
import { getUser } from '../../database/user';
import { chatValidator } from "../helpers/groupValidator/main";
import { bot } from "../main";
import { getKeyboard } from './getKeyboard';

export async function canInviteUser(ctx) {
    const chat = await getChat(ctx.chat.id);
    const user = await getUser(ctx.from.id);
    const verdict = chatValidator(chat, user);
    if(verdict.allowed) {
        bot.approveChatJoinRequest(chat.id, user.id);
        if(!(user.joinedGroups instanceof Array)) {
            user.joinedGroups = [];
        }
        if(!user.joinedGroups.includes(chat.id)) {
            user.joinedGroups.push(chat.id);
        }
        user.changed('joinedGroups', true);
        await user.save()
    } else {
        bot.declineChatJoinRequest(chat.id, user.id);
        bot.sendMessage(user.id, `You have applied to join the "${chat.title}". To do this, you need to authorize your wallet.`, { reply_markup: getKeyboard(false) })
    }
}