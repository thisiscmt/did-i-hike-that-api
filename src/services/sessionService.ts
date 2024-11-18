import { Session } from '../db/models/session.js';

export const getSessions = async (): Promise<{ rows: Session[] }> => {
    const result = await Session.findAll({
        attributes: ['sid', 'expires', 'data', 'createdAt'],
        order: ['createdAt']
    });

   return {
       rows: result,
   };
};

export const sessionExists = async (sid: string): Promise<boolean> => {
    const session = await Session.findByPk(sid, {
        attributes: ['sid']
    });

    return !!session;
};

export const deleteSession = async (sid: string): Promise<number> => {
    return await Session.destroy({
        where: {
            sid
        }
    });
};
