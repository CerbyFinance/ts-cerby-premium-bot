import detectEthereumProvider from '@metamask/detect-provider'

const provider = detectEthereumProvider()
export async function checkMetamask() {
    if(await provider) {
        return true;
    } else {
        return false;
    }
}

async function connectMetamask(): Promise<string> {
    return (await (window as any).ethereum.request({ method: 'eth_requestAccounts' }))[0];
}

export interface signedMessage {
    from: string,
    signature: string
}

export async function signMessage(msg: string): Promise<signedMessage> {
    const from = await connectMetamask();
    return new Promise((resolve, reject) => {
        (window as any).ethereum.sendAsync({
            method: 'personal_sign',
            params: [msg, from],
            from,
        }, function (err: any, result: any) { 
            if(err) { console.error(err); reject(err); }
            resolve({
                from,
                signature: result.result
            })
        });
    })
}