import { DataTypes, Model, Op } from 'sequelize';
import { DB } from './connectDB';
import { disconnectWallet } from '../helpers/disconnectWallet';

interface Wallet extends Model {
    id: number

    userId: number,
    address: string, // primary key

    signature: string,
    signMessage: string,

    balance: string

    balanceUpdatedAt: Date,

    createdAt: Date,
    updatedAt: Date
}

const wallets = DB.define<Wallet>('wallets', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true  },
    userId: DataTypes.BIGINT,

    address: DataTypes.STRING,
    signature: DataTypes.STRING,
    signMessage: DataTypes.STRING,

    balance: DataTypes.JSONB,
    balanceUpdatedAt: DataTypes.TIME,
});

export async function createWallet(userId: number, address: string, signature: string, signMessage: string): Promise<[Wallet, boolean] | null> {
    try {
        return await wallets.findOrCreate({ // returned [wallet, created]
            where: {
                address
            },
            defaults: {
                userId,
                signature,
                signMessage
            }
        });
    } catch(err) {
        console.error(err);
        throw err;
        return null;
    }
}

export async function getWallet(address: string): Promise<Wallet | null> {
    try {
        return await wallets.findOne({ where: { address }});
    } catch(err) {
        console.error(err);
        return null;
    }
}

export async function getUsersByWallet(address) {
    try {
        return await wallets.findAll({ where: { address }});
    } catch(err) {
        console.error(err);
        return null;
    }
}

export async function getUserWallets(id): Promise<Wallet[] | null> {
    try {
        return await wallets.findAll({ where: { userId: id }, order: [['id', 'ASC']]});
    } catch(err) {
        console.error(err);
        return null;
    }
}

// export async function getUsersByWallet(address): Promise<Wallet[] | null> {
//     try {
//         return await wallets.findAll({ where: { address }});
//     } catch(err) {
//         console.error(err);
//         return null;
//     }
// }

// export async function getJoinedUsers() {
//     try {
//         return await users.findAll({ where: {
//             joinedGroups: {
//                 [Op.not]: null
//             }
//         }})
//     } catch(err) {
//         console.error(err);
//         return null;
//     }
// }