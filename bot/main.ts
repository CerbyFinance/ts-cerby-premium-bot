import * as TelegramBot from 'node-telegram-bot-api';
import { botToken } from '../config.json';
import { connectWallet } from './triggers/connectWallet'
import { start } from './triggers/start';
import { callbackQueryParser } from './triggers/callbackQuery';
import { getWallet } from './triggers/getWallet';
import { initialize } from './triggers/initializeGroup';
import { checkAccessToGroup } from './triggers/checkGroup';
import { canInviteUser } from './triggers/canInviteUser';
import { settings } from './triggers/settings';
import { disconnectAllWalletsStub } from './triggers/disconnectWallet';

export const bot = new TelegramBot(botToken, { polling: true });

export async function startBotPolling() {
    bot.onText(/^\/start$/, connectWallet);
    bot.onText(/^Connect wallet$/, connectWallet);

    bot.onText(/^Get wallet$/, (msg) => {
        if(msg.chat.type != 'private') {
            return;
        }
         getWallet(msg.from.id)
        });

    bot.onText(/^Disconnect wallet$/, disconnectAllWalletsStub);
    bot.onText(/^Settings$/, settings);
    bot.onText(/^Check access to groups$/, checkAccessToGroup);
    bot.onText(/^\/initialization (\w+) (\d+)$/, initialize);
    bot.on("callback_query", callbackQueryParser);
    // console.log(await bot._getUpdates());

    // bot.on('new_chat_members', newChatMember);

    bot.on('chat_join_request', canInviteUser);
}