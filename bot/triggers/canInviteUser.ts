import { getChat } from "../../database/chat";
import { getUser } from '../../database/user';
import { chatValidator } from "../helpers/groupValidator/main";
import { bot } from "../main";
import { getKeyboard } from './getKeyboard';

export async function canInviteUser(ctx) {
    const chat = await getChat(ctx.chat.id);
    if(!chat) {
        return;
    }
    const user = await getUser(ctx.from.id);
    if(user) {
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
            return await user.save()
        } else {
            bot.sendMessage(user.id, `You have applied to join the "${chat.title}". Your join request has been rejected because you do not qualify.\n*Cause:* ${verdict.comment}`, { reply_markup: getKeyboard(true) })
        }
    } else {
        bot.sendMessage(ctx.from.id, `You have applied to join the "${chat.title}". To do this, you need to authorize your wallet.`, { reply_markup: getKeyboard(false) })
    }

    return bot.declineChatJoinRequest(ctx.chat.id, ctx.from.id);
}