import { checkMetamask, signMessage } from "./metamask";
import { wss } from './ws';
import { cerbyAnim } from "./cerby";
import { mobileCheck } from './mobileCheck';
// import * as QRCode from 'qrcode';

cerbyAnim.play();

if(document.getElementById('test3')) {
    (document.getElementById('test3') as HTMLElement).innerHTML = `<a href="https://metamask.app.link/dapp/${window.location.href.replace(window.location.protocol + '//', '')}">Mobile app</a>`
}


(async () => {
    const metamask = await checkMetamask();
    const button = document.getElementById('wallet-connect-metamask') as HTMLButtonElement;
    if(metamask && button) {
        button.innerText = "Establishing a connection to the server";
        const socket = new wss();
        button.addEventListener("click", async () => {
            button.disabled = true;
            button.innerText = "Waiting for signature";
            try {
                const signature = await signMessage(signHash);
                socket.sendSign(signature);
                button.innerText = "Successful";
            } catch(err) {
                button.disabled = false;
                button.innerText = "Connect wallet";
            }
        })
        while(!socket.connected && !socket.closed) {
            await new Promise(r => setTimeout(r, 250));
        }
        if(socket.closed) {
            return button.innerText = "An error occurred while connecting to the server."
        }
        let signHash = await socket.authAndGetSignHash();
        button.innerText = "Connect wallet";
        button.disabled = false;
    } else {
        if(((navigator as any).userAgentData && (navigator as any).userAgentData.mobile) || mobileCheck()) {
            button.innerText = "Open mobile metamask";
        } else {
            button.innerText = "Please install metamask";
            // show qr
        }
        button.disabled = false;
        button.addEventListener("click", () => {
            window.open(`https://metamask.app.link/dapp/${window.location.href.replace(window.location.protocol + '//', '')}`)
        });
    }
})()