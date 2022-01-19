import { superUsers } from '../config.json';
import { bot } from '../bot/main';


export async function superUserErrorHandler(message) {
    superUsers.forEach(async (id) => {
        try {
            bot.sendMessage(id, message)
        } catch(err) {
            // maybe superuser stopped bot
            console.log(err);
        }
    })
}