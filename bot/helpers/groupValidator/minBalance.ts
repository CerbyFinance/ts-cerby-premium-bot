import { numWithCommas } from "../numWithCommas"
import { verdict } from "./main";

export function minBalanceValidator(userBalance, config): verdict {
    if(config.minBalance < userBalance) {
        return {
            allowed: true
        }
    } else {
        return {
            allowed: false,
            comment: `You are missing ${numWithCommas(config.minBalance - userBalance)} CERBY.`,
            percent: userBalance / (config.minBalance / 100)
        }
    }
}