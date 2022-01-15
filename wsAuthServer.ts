import { WebSocketServer } from 'ws';
import { wssAuthPort } from './config.json';
import { getSession } from './database/sessions';
import { randomBytes, createHmac, createHash } from 'crypto';
import { getUser } from './database/user';
import { validate } from 'uuid';
import { recoverPersonalSignature } from '@metamask/eth-sig-util'
import { clean } from './bot/helpers/clean';
import { getWallet } from './bot/triggers/getWallet';
import { linkWallet } from './helpers/linkWallet';

export async function startAuthorizeServer() {
    const wss = new WebSocketServer({ port: wssAuthPort });

    wss.on('connection', async function connection(ws) {
    try {
        ws.send(0x1); // Successful connection
        let queue = [];
        ws.on('message', msg => queue.push(msg));

        const sessionID = String(await getMessage(queue, 1));
        if(!validate(sessionID)) {
            throw "Incorrect UUID";
        }

        const session = await getSession(sessionID);
        if(!session) {
            throw "Session not found";
        }

        const user = await getUser(session.id);
        if(!user) {
            throw "User not found";
        }

        const salt = randomBytes(64).toString('hex');
        ws.send(salt);

        const expectedMsgOfSignature = '0x' + createHmac('sha256', salt).update(sessionID).digest('hex');
        const signature = String(await getMessage(queue, 10));
        if(signature.length !== 132) {
            throw "Invalid signature length";
        }
        const signingAddress = recoverPersonalSignature({ data: expectedMsgOfSignature, signature })

        await linkWallet(session.id, signingAddress, signature, expectedMsgOfSignature);
        getWallet(user.id, true);

        clean({
            chat: {id: session.id},
            message_id: session.botMessage
        });
        session.destroy();

        ws.send(0x1); // success
        ws.close();
    } catch(err) {
        ws.send(0x0);
        ws.close();
        console.log(err);
        // logger
    }
    });
}

async function getMessage(queue: Buffer[], maxTimeoutInMinutes: number) {
    return new Promise((resolve, reject) => {
        let interval;
        let timeout = setTimeout(() => {
            clearInterval(interval);
            reject("Connection timeout");
        }, maxTimeoutInMinutes * 60000);
        interval = setInterval(() => {
            if(queue.length > 0) {
                resolve(queue.shift());
                clearInterval(interval);
                clearTimeout(timeout);
            }
        }, 100)
    })
}