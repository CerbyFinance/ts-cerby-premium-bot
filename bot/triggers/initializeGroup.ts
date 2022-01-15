import { superUsers } from '../../config.json'
import { clean } from '../helpers/clean';
import { bot } from '../main';
import { numWithCommas } from '../helpers/numWithCommas';
import { createChat, getChat } from '../../database/chat'
import { isIfStatement } from 'typescript';

let initializations = {}

export async function initialize(msg: userMessage, match) {
    if(!superUsers.includes(msg.from.id)) {
        return;
    }
    if(msg.chat.type == 'private') {
        return;
    }
    clean(msg);
    const type = match[1];
    if(type == "minBalance") {
        if(!Number(match[2])) {
            const message = await bot.sendMessage(msg.chat.id, `*A number was expected after minBalance was passed.*\n*Previous command:* \`${match[0]}\`\nThis message will be deleted after 30 seconds.`, { parse_mode: "markdown"});
            clean(message, 30)
            return;
        }
        const minBalance = +match[2];
        const config = {
            id: msg.chat.id,
            title: msg.chat['title'],
            type,
            config: JSON.stringify({ minBalance }),
            creator: msg.from.id
        }
        const superid = Math.floor(Math.random() * 10000);
        const chat = await getChat(msg.chat.id)
        initializations[superid] = {
            NO: {
                previous: match[0]
            },
            YES: config
        }
        if(chat) {
            initializations[superid].message = `*Current config group*\n` +
            `*Title:* ${chat.title}\n` +
            `*Type:* by ${chat.type}\n` +
            `*Minimum balance for join:* ${numWithCommas(JSON.parse(chat.config).minBalance)} CERBY\n\n` +

            `*Change to*\n` +
            `*Title:* ${config.title}\n` +
            `*Type:* by ${config.type}\n` +
            `*Minimum balance for join:* ${numWithCommas(minBalance)} CERBY\n\n` +

            `Is that correct?`
        } else {
            initializations[superid].message = `*Current config group*\n` +
            `*Title:* ${config.title}\n` +
            `*Type:* by ${config.type}\n` +
            `*Minimum balance for join:* ${numWithCommas(minBalance)} CERBY\n\n` +
            `Is that correct?`
        }
        const message = await bot.sendMessage(msg.chat.id, initializations[superid].message,
                                                           {
                                                               parse_mode: "markdown",
                                                               reply_markup: {inline_keyboard: [[
                                                                {
                                                                    text: "Yes",
                                                                    callback_data: `INIT_YES_${superid}`
                                                                },
                                                                {
                                                                    text: "No",
                                                                    callback_data: `INIT_NO_${superid}`
                                                                }
                                                            ]]}
                                                           });
    } else {
        const message = await bot.sendMessage(msg.chat.id, `*This type(${type}) was not found.*\nThis message will be deleted after 30 seconds.`, { parse_mode: "markdown"});
        clean(message, 30)
    }
}

export async function initializationCallback(query) {
    if(!superUsers.includes(query.from.id)) {
        bot.answerCallbackQuery(query.id, { text: "You cannot do this action"});
        return;
    }
    const [INIT, type, superid] = query.data.split('_');
    if(type == "NO") {
        bot.answerCallbackQuery(query.id, { text: "Canceled" });
        bot.editMessageText(`*Group initialization canceled at user request.*${initializations[superid] ? `\n\n*Previous command:* \`${initializations[superid].NO.previous}\`` : ``}\nThis message will be deleted after 30 seconds.`,
        { chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: "markdown" });
        clean(query.message, 30);
        delete initializations[superid];
    } else if(type == "YES") {
        bot.answerCallbackQuery(query.id, { text: "Approved" });
        if(initializations[superid]) {
        const { id, title, type, config, creator } = initializations[superid].YES;
        const inviteLink = (await bot.createChatInviteLink(id, { creates_join_request: true })).invite_link;
        createChat({
            id,
            title,
            type,
            config,
            creator,
            inviteLink
        });
        bot.editMessageText(initializations[superid].message.replace('Is that correct?', '*Approved*'), {
            chat_id: query.message.chat.id, message_id: query.message.message_id, parse_mode: "markdown"
        })
        }
    }
}