import { disconnectCallback } from "./disconnectWallet";
import { initializationCallback } from './initializeGroup';

export async function callbackQueryParser(query) {
    if(query.data.includes("disconnect")) {
        disconnectCallback(query);
    } else if(query.data.includes("INIT")) {
        initializationCallback(query);
    }
}