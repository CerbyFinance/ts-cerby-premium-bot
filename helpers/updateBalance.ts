import { isIfStatement } from "typescript";
import { getUser } from "../database/user";
import { getAmount } from "./getAmount";
import { bot } from "../bot/main";
import { clean } from "../bot/helpers/clean";
import { getKeyboard } from "../bot/triggers/getKeyboard";

export async function updateBalance(id: number, userRequest = false, force = false): Promise<userMessage | -1 | void> {
    const user = await getUser(id);
    if(user.address && (+user.balanceUpdatedAt + 30000 < Date.now() || force)) {
        let message;
        if(userRequest) {
            message = bot.sendMessage(user.id, "🕖 Updating balance...", { parse_mode: "markdown" });
        }
        try {
            const amount = await getAmount(user.address);

            user.cerby = Math.floor(amount.amountLiquid + amount.amountStaked);
            user.usd = Math.floor(amount.amountLiquidInUsd + amount.amountStakedInUsd);
            user.balanceUpdatedAt = new Date();

            await user.save();
        } catch(err) {
            bot.editMessageText("There was a problem with the bot. We are trying to resolve it as quickly as possible. Please try again later.", { chat_id: message.chat.id, message_id: message.message_id, parse_mode: "markdown" });
            return -1;
        }
        if(userRequest) {
            return message;
        }
    } else {
        return;
    }
}