export function getKeyboard(walletTied: boolean) {
    if(walletTied) {
        return {keyboard: [
        [
            { text: "Get wallet" }
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