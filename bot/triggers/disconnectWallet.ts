import { bot } from '../main'
import { createUser, getUser } from '../../database/user';
import { disconnectWallet } from '../../helpers/disconnectWallet';
import { getKeyboard } from './getKeyboard';

export const noWalletMessage = `You do not have an associated wallet.`;

export async function disconnectWalletTrigger(msg: userMessage) {
    if(msg.chat.type != 'private') {
        return;
    }
    const user = await createUser(msg);

    if(user.address) {
        let text = `*Are you sure you want to unlink your wallet?* (You will be excluded from all premium groups)`;
        bot.sendMessage(user.id, text, {
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "Yes",
                        callback_data: "disconnectYES"
                    },
                    {
                        text: "No",
                        callback_data: "disconnectNO"
                    }
                ]]
        }
        })
    } else {
        bot.sendMessage(user.id, noWalletMessage, { reply_markup: getKeyboard(false) });
    }
}

export async function disconnectCallback(query) {
    bot.answerCallbackQuery(query.id, { text: "Ok" });

    const user = await getUser(query.from.id);
    if(query.data == "disconnectYES") {
        if(user.address) {
            await disconnectWallet(query.from.id);
            bot.editMessageText("Your wallet is disconnected.", { chat_id: query.message.chat.id, message_id: query.message.message_id });
        } else {
            bot.editMessageText(noWalletMessage, { chat_id: query.message.chat.id, message_id: query.message.message_id });
        }
    } else {
        if(user.address) {
            bot.editMessageText("Your wallet remains connected.", { chat_id: query.message.chat.id, message_id: query.message.message_id });
        } else {
            bot.editMessageText(noWalletMessage, { chat_id: query.message.chat.id, message_id: query.message.message_id });
        }
    }
}