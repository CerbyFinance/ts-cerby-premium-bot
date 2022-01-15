import { startBotPolling } from "./bot/main";
import * as express from 'express';
import * as helmet from 'helmet'; // Sets custom http headers for security
// import * as morgan from 'morgan';
// import { visitors } from './logger/visitors';
import { authRouter } from './routers/auth';
import { listenPort } from './config.json';
import { startAuthorizeServer } from './wsAuthServer';
import { startBalanceChecker } from './helpers/balanceChecker';

startBotPolling();
startAuthorizeServer();
startBalanceChecker();

const app = express();

app.use(helmet({
    contentSecurityPolicy: false // Needed for the metamask mobile app to work correctly
}));

// app.use(morgan("combined", { stream: visitors() })); // For logs
app.use(express.static(__dirname + '/dist'));

app.engine('pug', require('pug').__express);
app.set('view engine', 'pug');

app.use('/auth', authRouter)

app.get('/', (req, res) => {
    res.render('main');
});

app.get('*', (req, res) => {
    res.render('auth404');
})

app.listen(listenPort, () => {
    console.log(`Server listening on http, port: ${listenPort}`)
});