import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';

import { Hike } from '../db/models';

export const getHikes = async (page: number, pageSize: number, trail?: string, startDate?: Date, endDate?: Date):
    Promise<{ rows: Hike[]; count: number }> =>
{
    const whereClause: Record<string, any> = {};

    if (trail) {
        whereClause.trail = trail;
    }

    if (startDate) {
        if (endDate) {
            whereClause.dateOfHike = {
                [Op.gte]: startDate,
                [Op.lte]: endDate
            };
        } else {
            whereClause.dateOfHike = {
                [Op.eq]: startDate
            };
        }
    }

    return await Hike.findAndCountAll({
        attributes: ['id', 'trail', 'dateOfHike', 'description', 'link', 'weather', 'crowds', 'tags'],
        where: whereClause,
        raw: true
    });
};

export const createHike = async (hike: Hike) => {
    const hikeRecord = await Hike.create({...hike});
    const dataPath = path.join(process.cwd(), 'data', 'images');

    try {
        fs.statSync(path.join(dataPath, hikeRecord.id));
    } catch (err) {
        fs.mkdirSync(path.join(dataPath, hikeRecord.id));
    }

    const photoPath = path.join(dataPath, momentRecord.id, request.file.originalname);
    fs.renameSync(path.join(uploadPath, request.file.originalname), photoPath);

    await photo.create({
        filePath: `${momentRecord.id}/${request.file.originalname}`,
        momentId: momentRecord.id,
        userId: request.currentUserId
    });

    fs.rmSync(uploadPath, { recursive: true })



};

// export const updateHike = async (hike: HikeRecord) => {
//     const hikeRec = hike.get();
//
//     await Hike.update({...hikeRec}, {
//         where: {
//             id: hikeRec.id
//         }
//     });
// };
