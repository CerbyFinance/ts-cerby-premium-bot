import { bot } from '../main'
import { authUrl } from '../../config.json';
import { createSession } from '../../database/sessions';
import { clean } from '../helpers/clean';
import { createUser } from '../../database/user';
import { getWallet } from './getWallet';
import { getKeyboard } from './getKeyboard';

export async function start(msg: userMessage) {
    if(msg.chat.type != 'private') {
        return;
    }
    const user = await createUser(msg);
    let message = await bot.sendMessage(msg.from.id, `${msg.from.first_name}${msg.from.last_name ? ' ' + msg.from.last_name : ''}, welcome and information message..`, {
        parse_mode: "markdown",
        reply_markup: getKeyboard(user.wallets)
    });
}