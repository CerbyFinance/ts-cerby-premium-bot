import { DataTypes, Model, Op } from 'sequelize';
import { DB } from './connectDB';



export interface User extends Model {
    id: number,
    first_name: string,
    last_name: string,
    // address: string,

    joinedGroups: number[],

    // cerby: number,
    // usd: number,
    // balanceUpdatedAt: Date,

    // signature: string,
    // signMessage: string,

    wallets: number,
    notification: boolean,

    createdAt: Date,
    updatedAt: Date
}

const users = DB.define<User>('users', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    // address: DataTypes.STRING,

    joinedGroups: DataTypes.ARRAY(DataTypes.BIGINT),

    // cerby: DataTypes.BIGINT,
    // usd: DataTypes.BIGINT,
    // balanceUpdatedAt: DataTypes.TIME,

    // signature: DataTypes.STRING,
    // signMessage: DataTypes.STRING

    wallets: DataTypes.INTEGER,
    notification: DataTypes.BOOLEAN
});

export async function createUser(userMessage: userMessage): Promise<User | null> {
    try {
        let [user, created] = await users.findOrCreate({
            where: { id: userMessage.from.id },
            defaults: {
                first_name: userMessage.from.first_name,
                last_name: userMessage.from.last_name,
                wallets: 0
            }
        });
        if(!created) {
            user.first_name = userMessage.from.first_name,
            user.last_name = userMessage.from.last_name;
            user.save();
        }
        return user;
    } catch(err) {
        console.error(err);
        throw err;
        return null;
    }
}

export async function getUser(id): Promise<User | null> {
    try {
        return await users.findOne({ where: { id }});
    } catch(err) {
        console.error(err);
        return null;
    }
}

// export async function getUsersByWallet(address) {
//     try {
//         return await users.findAll({ where: { address }});
//     } catch(err) {
//         console.error(err);
//         return null;
//     }
// }

export async function getJoinedUsers() {
    try {
        return await users.findAll({ where: {
            [Op.or]: [{ joinedGroups: { [Op.not]: null }},
                      { notification: true }]
        }})
    } catch(err) {
        console.error(err);
        return null;
    }
}