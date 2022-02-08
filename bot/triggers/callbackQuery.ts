import { disconnectAllWalletsTrigger, disconnectCallback, disconnectWalletTrigger } from "./disconnectWallet";
import { initializationCallback } from './initializeGroup';
import { bot } from "../main";
import { connectAnotherWallet, goToSettingsCallback, notificationCallback, cancelConnectAnotherWallet, myWallets, getWalletCallback } from "./settings";

export async function callbackQueryParser(query) {
    if(query.data.includes("disconnect") || query.data.includes("DIS")) {
        disconnectCallback(query);
    } else if(query.data.includes("INIT")) {
        initializationCallback(query);
    } else if(query.data.includes('notification')) {
        notificationCallback(query);
    } else if(query.data == 'Connect another wallet') {
        connectAnotherWallet(query);
    } else if(query.data == 'Go to settings') {
        goToSettingsCallback(query);
    } else if(query.data.includes('DELSESSION')) {
        cancelConnectAnotherWallet(query);
    } else if(query.data == 'DALLWALLETS') {
        disconnectAllWalletsTrigger(query);
    } else if(query.data == 'My wallets') {
        myWallets(query);
    } else if(query.data.includes('WALLET')) {
        getWalletCallback(query);
    } else if(query.data.includes("DATT")) {
        disconnectWalletTrigger(query);
    } else {
        bot.answerCallbackQuery(query.id, { text: "This action was not found"});
    }
}