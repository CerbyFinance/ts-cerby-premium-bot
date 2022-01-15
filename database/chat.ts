import { DataTypes, Model } from 'sequelize';
import { isBuffer } from 'util';
import { DB } from './connectDB';

export interface Chat extends Model {
    id: number,
    title: string,
    type: string,
    config: string, // JSON
    creator: number,
    inviteLink?: string,
    updatedAt?: Date,
    createdAt?: Date
}

const chats = DB.define<Chat>('chats', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true
    },
    title: DataTypes.STRING,
    type: DataTypes.STRING,
    config: DataTypes.JSON,
    creator: DataTypes.BIGINT,
    inviteLink: DataTypes.STRING
});

export async function createChat(chat): Promise<Chat | null> {
    try {
        const [newChat, created] = await chats.findOrCreate({
            where: { id: chat.id },
            defaults: chat
        });
        if(!created) {
            newChat.title = chat.title;
            newChat.type = chat.type;
            newChat.config = chat.config;
            newChat.creator = chat.creator;
            newChat.inviteLink = chat.inviteLink;
            await newChat.save()
        }
        return newChat;
    } catch(err) {
        console.error(err);
        return null;
    }
}

export async function getChat(id): Promise<Chat | null> {
    try {
        return await chats.findOne({ where: { id }});
    } catch(err) {
        console.error(err);
        return null;
    }
}

export async function getAllChatConfig(): Promise<Chat[] | null> {
    try {
        return await chats.findAll();
    } catch(err) {
        console.error(err);
        return null;
    }
}