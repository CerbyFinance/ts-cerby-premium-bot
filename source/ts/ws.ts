import { signedMessage } from './metamask'
import HMAC256 from 'crypto-js/hmac-sha256'; // Takes up less space, does the same thing as node-forge
// import { hmac } from 'node-forge';

export class wss {
    private ws: WebSocket;
    public connected: boolean;
    public closed: boolean;
    constructor() {
        this.connected = false;
        this.closed = false;
        this.ws = new WebSocket(`wss://${window.location.hostname}/api`);
        this.ws.onopen = () => {
            this.ws.onmessage = this.successfulMsg;
        }
    }
    private successfulMsg = (event: any) => {
        const msg = +event.data;
        if(msg == 0x1) {
            this.connected = true;
            this.ws.removeEventListener('message', this.successfulMsg);
        } else {
            this.closed = true;
            this.ws.close()
        }
    }
    authAndGetSignHash = async () => {
        this.ws.send(window.location.pathname.split('/').pop()!);
        const salt: string = await new Promise((r) => {
            this.ws.onmessage = (msg) => {
                r(String(msg.data)); // forge does not support arraybuffer, but it can handle text just fine.
            }
        });

        // const signHash = hmac.create(); // node-forge
        //     signHash.start('sha256', salt)
        //     signHash.update(window.location.pathname.split('/').pop()!);

        // return signHash.digest().toHex();

        return HMAC256(window.location.pathname.split('/').pop()!, salt).toString()
    }
    sendSign = async ({ signature }: signedMessage) => {
        this.ws.send(signature);
    }
}
