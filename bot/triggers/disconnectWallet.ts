import { bot } from '../main'
import { createUser, getUser } from '../../database/user';
import { disconnectWallet } from '../../helpers/disconnectWallet';
import { getKeyboard } from './getKeyboard';
import { clean } from '../helpers/clean';
import { getWallet } from '../../database/wallet';
import { settingsErrorOrInfo } from './settings';

export const noWalletMessage = `You do not have an associated wallet.`;

export async function disconnectAllWalletsStub(msg: userMessage) {
    const user = await getUser(msg.from.id);
    if(user.wallets) {
        bot.sendMessage(msg.from.id, "This feature has been moved to *Settings*.",
            {
                parse_mode: "markdown",
                reply_markup: getKeyboard(true)
            })
    } else {
        bot.sendMessage(user.id, noWalletMessage, { reply_markup: getKeyboard(false) });
    }

}

export async function disconnectAllWalletsTrigger(query) {
    const user = await getUser(query.from.id);

    if(user.wallets) {
        let text;
        if(user.wallets > 1) {
            text = `*Are you sure you want to disconnect all your wallets?* (You will be excluded from all premium groups)`
        } else {
            text = `*Are you sure you want to disconnect your wallet?* (You will be excluded from all premium groups)`;
        }
        bot.editMessageText(text, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "Yes",
                        callback_data: "disconnectYES"
                    },
                    {
                        text: `‹ Back`,
                        callback_data: 'Go to settings'
                    }
                ]]
            }
        })
    } else {
        clean({ ...query.message })
        bot.sendMessage(user.id, noWalletMessage, { reply_markup: getKeyboard(false) });
    }
}

export async function disconnectWalletTrigger(query) {
    const user = await getUser(query.from.id);

    if(user.wallets) {
        let wallet = query.data.split('-')[1];
        const walletObj = await getWallet(wallet);
        if(!walletObj || walletObj.userId != user.id) {
            return settingsErrorOrInfo(query.message.chat.id, query.message.message_id, "This wallet was not found.");
        }
        let text = `*Are you sure you want to disconnect your wallet* \`${wallet}\`*?* (You may be excluded from all premium groups)`;
        bot.editMessageText(text, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "Yes",
                        callback_data: `DIS-${wallet}`
                    },
                    {
                        text: `‹ Back`,
                        callback_data: 'My wallets'
                    }
                ]]
            }
        })
    } else {
        clean({ ...query.message })
        bot.sendMessage(user.id, noWalletMessage, { reply_markup: getKeyboard(false) });
    }
}

export async function disconnectCallback(query) {
    bot.answerCallbackQuery(query.id, { text: "Ok" });

    const user = await getUser(query.from.id);
    if(query.data == "disconnectYES" || query.data.includes('DIS')) {
        if(user.wallets) {
            if(query.data.includes('DIS')) {
                const walletObj = await getWallet(query.data.split('-')[1]);
                if(!walletObj || walletObj.userId != user.id) {
                    return settingsErrorOrInfo(query.message.chat.id, query.message.message_id, "This wallet was not found.");
                }
            }
            await disconnectWallet(query.from.id, query.data.includes('DIS') ? query.data.split('-')[1] : undefined);
            bot.editMessageText("Your wallet is disconnected.", { chat_id: query.message.chat.id, message_id: query.message.message_id, ...(query.data.includes("DIS") ? { reply_markup: {
                inline_keyboard: [[{
                    text: `‹ Back`,
                    callback_data: 'My wallets'
                }]]
            }
        } : {}) });
        } else {
            bot.editMessageText(noWalletMessage, { chat_id: query.message.chat.id, message_id: query.message.message_id });
        }
    }
}