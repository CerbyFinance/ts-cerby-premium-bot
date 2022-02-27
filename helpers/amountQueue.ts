interface request {
    reqFunc: () => Promise<unknown> // Request
    r: (value: unknown) => unknown  // Resolve
    rj: (reason?: any) => void      // Reject
}

interface IQueue {
    [chain: string]: {
        priveledged: request[],
        default: request[],
        managerWorking: boolean
    }
}

let queue: IQueue = {};

interface counter {
    [chain: string]: number
}

let counter = {};
let counterStartTime = Date.now();

export function addQueue(chain: string, reqFunc: request["reqFunc"], priveledged = false): Promise<any> {
    return new Promise((r, rj) => {
        if(!queue[chain]) {
            queue[chain] = {
                priveledged: [],
                default: [],
                managerWorking: false
            }
        }
        let currentQueue: IQueue[0]["priveledged"] | IQueue[0]["default"] | undefined = queue[chain][priveledged ? "priveledged" : "default"];
        const objRequest: request = {
            reqFunc,
            r,
            rj
        }
        if(!currentQueue) {
            currentQueue = [
                objRequest
            ]
        } else {
            currentQueue.push(objRequest)
        }
        if(!queue.managerWorking) {
            managerQueue(chain);
        }
    });
}

async function managerQueue(chain) {
    const chainQueue = queue[chain];
    if(chainQueue.managerWorking == true) {
        return;
    }
    if(counter[chain] == undefined) {
        counter[chain] = 0;
    }
    chainQueue.managerWorking = true;
    while(chainQueue.priveledged.length > 0 || chainQueue.default.length > 0) {
        if(counter[chain] > 1200) {
            await new Promise((r) => setTimeout(r, (counterStartTime + 60*1e3) - Date.now()));
            continue;
        }
        const currentQueue = chainQueue[chainQueue.priveledged.length ? "priveledged" : "default"];
        const currentElement = currentQueue.shift();
        await currentElement.reqFunc()
                .then(currentElement.r)
                .catch(currentElement.rj);
        counter[chain]++;
    }
    chainQueue.managerWorking = false;
}

setInterval(() => { Object.keys(counter).forEach((chain) => counter[chain] = 0); counterStartTime = Date.now() }, 60*1e3);