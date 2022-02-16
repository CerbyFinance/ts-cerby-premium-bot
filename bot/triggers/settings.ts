import { bot } from "../main";
import { noWalletMessage } from "./disconnectWallet";
import { getKeyboard } from "./getKeyboard";
import { createUser, getUser, User } from "../../database/user";
import { createSession, getSession } from "../../database/sessions";
import { authUrl } from '../../config.json';
import { getUserWallets, getWallet } from "../../database/wallet";
import { shortenAddress } from "./getWallet";
import { numWithCommas } from "../helpers/numWithCommas";
import { chainInfo } from "./getWallet";

const settingsMessage = '⚙️ *Settings*';
const maxWallet = 12;

export async function settings(ctx) {
    if(ctx.chat.type != 'private') {
        return;
    }
    const user = await createUser(ctx);

    if(user.wallets) {
        bot.sendMessage(user.id, settingsMessage, {
            parse_mode: "markdown",
            reply_markup: getSettingsInlineKeyboard(user)
        })
    } else {
        bot.sendMessage(user.id, noWalletMessage, { reply_markup: getKeyboard(user.wallets) });
    }
}

export async function goToSettingsCallback(query) {
    const user = await getUser(query.from.id);

    if(user.wallets) {
        bot.editMessageText(settingsMessage, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown",
            reply_markup: getSettingsInlineKeyboard(user)
        });
    } else {
        bot.editMessageText(noWalletMessage, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            reply_markup: getKeyboard(user.wallets)
        })
    }
    bot.answerCallbackQuery(query.id, "⚙️ Settings")
}

export async function notificationCallback(query) {
    const user = await getUser(query.from.id);
    if(user.wallets) {
        if(query.data == 'Enable notification') {
            bot.answerCallbackQuery(query.id, "Notifications enabled");
            user.notification = true;
        } else {
            bot.answerCallbackQuery(query.id, "Notifications disabled");
            user.notification = false;
        }

        bot.editMessageText(settingsMessage, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown",
            reply_markup: getSettingsInlineKeyboard(user)
        })
        user.save();
    } else {
        bot.editMessageText(noWalletMessage, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown"
        })
    }
}

export function getSettingsInlineKeyboard(user: User) {
    return {
        inline_keyboard: [
            ...(user.wallets > 1 ? [[{
                text: "Your wallets",
                callback_data: "My wallets"
            }]] : []),
            [{
                text: `${user.notification ? "Disable" : "Enable"} notifications when stakes end`,
                callback_data: `${user.notification ? "Disable" : "Enable"} notification`
            }],
            [{
                text: "Connect another wallet",
                callback_data: "Connect another wallet"
            }],
            [{
                text: user.wallets == 1 ? "Disconnect wallet" : "Disconnect all wallets",
                callback_data: "DALLWALLETS"
            }]
    ]}
}

export async function cancelConnectAnotherWallet(query) {
    bot.answerCallbackQuery(query.id, 'Connect another wallet cancelled');
    const session = await getSession(query.data.split('.')[1]);
    if(session) {
        session.destroy();
    }
    goToSettingsCallback(query);
}

export async function connectAnotherWallet(query) {
    const user = await getUser(query.from.id);
    if(user.wallets >= maxWallet) {
        return settingsErrorOrInfo(query.message.chat.id, query.message.message_id, "You cannot connect more than 2 wallets.")
    }
    if(user.wallets) {
        let session = await createSession(query.from.id, settingsErrorOrInfo);
        if(!session) {
            settingsErrorOrInfo(query.message.chat.id, query.message.message_id);
            // logger
            return;
        }
        let sessionID = session.sessionID;
        let message = await bot.editMessageText("Please, authorize your wallet here", {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Auth page",
                            url: `${authUrl}${sessionID}`
                        },
                    ],
                    [
                        {
                            text: "‹ Back",
                            callback_data: `DELSESSION.${sessionID}`
                        }
                    ]
                ]
            }
        });
        bot.answerCallbackQuery(query.id, 'Session created');
        try {
            await session.reload();
            if(session.sessionID != sessionID) {
                throw "Session updated";
            }
            session.botMessage = message.message_id;
            await session.save({ fields: ['botMessage']});
        } catch(err) {
            settingsErrorOrInfo(session.id, session.botMessage, "This session has been deactivated");
        }
    } else {
        bot.editMessageText(noWalletMessage, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown"
        })
    }
}


export async function settingsErrorOrInfo(chat_id: number, message_id: number, message?: string) {
    bot.editMessageText(message || "There was a problem with the bot. We are trying to solve it as quickly as possible.", {
        chat_id, message_id,
        parse_mode: "markdown",
        reply_markup: {
            inline_keyboard: [
                [{
                    text: `‹ Back`,
                    callback_data: 'Go to settings'
                }]
            ]
        }
    })
}

export async function myWallets(query) {
    const user = await getUser(query.from.id);
    if(user.wallets) {
        bot.answerCallbackQuery(query.id, "Here are your wallets");
        const wallets = await getUserWallets(user.id);
        let width = 2;
        if(wallets.length / 4 >= 3) {
            width = 4;
        } else if(wallets.length / 3 >= 3) {
            width = 3;
        }
        let keyboardMatrix = [];
        for (let i = 0; i < Math.ceil(wallets.length / width); i++){
            keyboardMatrix.push(wallets.slice(( i * width ), ( i * width ) + width).map((wallet) => {return { text: shortenAddress(wallet.address), callback_data: `WALLET-${wallet.address}`}}))
        }
        console.log(keyboardMatrix)
        bot.editMessageText("*Your wallets*", {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: [
                    ...keyboardMatrix,
                    [{
                        text: `‹ Back`,
                        callback_data: 'Go to settings'
                    }]
                ]
            }
        })
    } else {
        bot.answerCallbackQuery(query.id, noWalletMessage);
        bot.editMessageText(noWalletMessage, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown"
        })
    }
}

export async function getWalletCallback(query) {
    const user = await getUser(query.from.id);
    if(user.wallets) {
        bot.answerCallbackQuery(query.id, "Your wallet");
        let address = query.data.split('-')[1];
        const wallet = await getWallet(address);
        if(!wallet || wallet.userId != user.id) {
            return settingsErrorOrInfo(query.message.chat.id, query.message.message_id, "This wallet was not found.");
        }
        const walletBalance = JSON.parse(wallet.balance);
        let text = `*Your wallet:* \`${wallet.address}\`\n` +
                   `*Balance:* ${numWithCommas(walletBalance.cerby || 0)} CERBY (${numWithCommas(walletBalance.usd || 0)} USD)\n`
                   + chainInfo(walletBalance);
        bot.editMessageText(text, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown",
            reply_markup: {
                inline_keyboard: [
                    [{
                        text: `Disconnect wallet`,
                        callback_data: `DATT-${wallet.address}`
                    },
                    {
                        text: `‹ Back`,
                        callback_data: 'My wallets'
                    }]
                ]
            }
        })

    } else {
        bot.answerCallbackQuery(query.id, noWalletMessage);
        bot.editMessageText(noWalletMessage, {
            chat_id: query.message.chat.id, message_id: query.message.message_id,
            parse_mode: "markdown"
        })
    }
}