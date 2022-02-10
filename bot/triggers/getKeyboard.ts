export function getKeyboard(walletTied: number) {
    if(walletTied) {
        return {keyboard: [
        [
            { text: walletTied > 1 ? "Your wallets" : "Your wallet" }
        ],
        [
            { text: "Settings"}, { text: "Check access to groups" }
        ]
    ], resize_keyboard: true}
    } else {
        return { keyboard: [[
            { text: "Connect wallet" }
        ]], resize_keyboard: true}
    }
}