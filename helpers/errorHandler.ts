// // import { producerService } from "./kafkaServices/producerService";

export class Logger {
    // readonly info: string;
    // readonly sendMessage: producerService["sendMessages"];
    constructor(/*info: string, sendMessage: producerService["sendMessages"]*/) {
        // this.info = info;
        // this.sendMessage = sendMessage;
    }
    log(message: string | Object) {
        if(message instanceof Object) {
            message = JSON.stringify(message, null, 2);
        }
        console.log(message);
        // return this.sendMessage([`Log at ${Date()} from ${this.info}\n${message}`]);
    }
    warn(message: string | Object) {
        if(message instanceof Object) {
            message = JSON.stringify(message, null, 2);
        }
        console.warn(message);
        // return this.sendMessage([`Warn at ${Date()} from ${this.info}\n${message}\n\nStack trace: ${new Error().stack}`]);
    }
    error(message: string | Object) {
        if(message instanceof Object) {
            message = JSON.stringify(message, null, 2);
        }
        console.error(message);
        // return this.sendMessage([`Error at ${Date()} from ${this.info}\n${message}\n\nStack trace: ${new Error().stack}`]);
    }
}


export function criticalError(message) {
    new Logger().error(message);
    throw message;
}