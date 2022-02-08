import { bot } from '../main'
import { authUrl } from '../../config.json';
import { createSession } from '../../database/sessions';
import { clean } from '../helpers/clean';
import { createUser } from '../../database/user';
import { getWallet } from './getWallet';
import { getKeyboard } from './getKeyboard';

export async function connectWallet(msg: userMessage) {
    if(msg.chat.type != 'private') {
        return;
    }
    const user = await createUser(msg);
    if(user.wallets) {
        bot.sendMessage(msg.from.id, "You already have a connected wallet.", { reply_markup: getKeyboard(true) });
        getWallet(user.id);
    } else {
        let session = await createSession(msg.from.id);
        if(!session) {
            bot.sendMessage(msg.from.id, "There was a problem with the bot. We are trying to solve it as quickly as possible.");
            // logger
            return;
        }
        let sessionID = session.sessionID;
        let message = await bot.sendMessage(msg.from.id, "Please, authorize your wallet here", {
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "Auth page",
                        url: `${authUrl}${sessionID}`
                    }
                ]]
            }
        });
        try {
            await session.reload();
            if(session.sessionID != sessionID) {
                throw "Session updated";
            }
            session.botMessage = message.message_id;
            await session.save({ fields: ['botMessage']});
        } catch(err) {
            clean(message);
        }
    }
}