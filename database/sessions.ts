import { DataTypes, Model } from 'sequelize';
import { DB } from './connectDB';
import { v4 as uuidv4 } from 'uuid';
import { clean } from '../bot/helpers/clean';
import { bot } from '../bot/main';
import { getUser } from './user';

interface Session extends Model {
    sessionID: string,
    id: number,
    deactivation: Date,
    botMessage: number
}

const sessions = DB.define<Session>('session', {
    sessionID: {
        type: DataTypes.UUID
    },
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true
    },
    deactivation: {
        type: DataTypes.DATE,
    },
    botMessage: {
        type: DataTypes.BIGINT
    }
}, {
    createdAt: false,
    updatedAt: false
});

export async function createSession(id): Promise<Session | null> {
    try {
        let [session, created] = await sessions.findOrCreate({
            where: { id },
            defaults: {
                sessionID: uuidv4(),
                deactivation: Date.now() + 0x5265c00 // 0x5265c00 - 1 day (24 * 3600 * 1000)
            }
        });
        if(!created) {
            if(session.botMessage) {
                clean({
                    chat: {id: session.id},
                    message_id: session.botMessage
                });
            }
            await session.destroy();
            return createSession(id);
        }
        return session;
    } catch(err) {
        console.error(err);
        // logger
        return null;
    }
}

export async function getSession(sessionID): Promise<Session | null> {
    try {
        let session = await sessions.findOne({ where: { sessionID }});
        if(session != null && +session.deactivation < Date.now()) {
            console.log("Session deactivated");
            let user = await getUser(session.id);
            clean({
                chat: {id: session.id},
                message_id: session.botMessage
            });
            bot.sendMessage(session.id, `❌ ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}, your session has been deactivated after the expiration date.`);
            session.destroy();
            return null;
        }
        return session;
    } catch(err) {
        console.error(err);
        // logger
        return null;
    }
}