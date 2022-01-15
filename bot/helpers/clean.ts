import { bot } from '../main';

export async function clean(msg, seconds=0) {
    try {
        console.log("CLEAN")
        if(seconds) {
            await new Promise(r => setTimeout(r, seconds*1e3));
        }
        console.log(msg)
        await bot.deleteMessage(msg.chat.id, msg.message_id);
    } catch(err) {
        // console.error(err)
    }
}