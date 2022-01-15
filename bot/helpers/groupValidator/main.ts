import { minBalanceValidator } from "./minBalance";

export interface verdict {
    allowed: boolean;
    comment?: string;
    percent?: number;
}

export function chatValidator(chat, user): verdict {
    let verdict;
    if(chat.type == "minBalance") {
        verdict = minBalanceValidator(user.cerby, JSON.parse(chat.config));
    }
    return verdict;
}