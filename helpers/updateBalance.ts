import { isIfStatement } from "typescript";
import { getUser } from "../database/user";
import { getAmount } from "./getAmount";
import { bot } from "../bot/main";
import { clean } from "../bot/helpers/clean";
import { getKeyboard } from "../bot/triggers/getKeyboard";

export async function updateBalance(id: number, userRequest = false, force = false): Promise<userMessage | void> {
    const user = await getUser(id);
    if(user.address && (+user.balanceUpdatedAt + 600000 < Date.now() || force)) {
        let message;
        if(userRequest) {
            message = bot.sendMessage(user.id, "🕖 Updating balance...", { parse_mode: "markdown" });
        }
        const amount = await getAmount(user.address);

        user.cerby = Math.floor(amount.amountLiquid + amount.amountStaked);
        user.usd = Math.floor(amount.amountLiquidInUsd + amount.amountStakedInUsd);
        user.balanceUpdatedAt = new Date();

        await user.save();
        if(userRequest) {
            return message;
        }
    } else {
        return;
    }
}