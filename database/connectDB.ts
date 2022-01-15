import { Sequelize } from "sequelize";
import { criticalError } from '../helpers/errorHandler';
import { dbHost, dbPort, dbName, dbAuth } from '../config.json';

interface IOptions {
    dbHost: string,
    dbPort: number,
    username: string,
    password: string,
    database: string
}

async function dbCheck(dbConnection: Sequelize, database: IOptions['database']) {
    try {
        await dbConnection.authenticate();
        console.log(`Connect to ${database} database successfully`);
    } catch (error) {
        criticalError(`Error connecting to ${database} database: ${error}`);
    }
}

export function dbInit({ dbHost, dbPort, username, password, database}: IOptions) {
    const dbConnection = new Sequelize({
        host: dbHost,
        port: dbPort,
        username,
        password,
        database,
        dialect: "postgres"
    });
    dbCheck(dbConnection, database);
    return dbConnection;
}

export const DB = dbInit(Object.assign({
    dbHost,
    dbPort,
    database: dbName
}, dbAuth));