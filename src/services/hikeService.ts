import { FindAndCountOptions, Op } from 'sequelize';

import {Hike, Hiker, Photo} from '../db/models/index.js';

export const getHikes = async (page: number, pageSize: number, trail?: string, startDate?: Date, endDate?: Date):
    Promise<{ rows: Hike[]; count: number }> =>
{
    const options: FindAndCountOptions = {
        attributes: ['id', 'trail', 'dateOfHike', 'description', 'link', 'weather', 'crowds', 'tags'],
        raw: true
    };
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

    if (Object.keys(whereClause).length > 0) {
        options.where = whereClause;
    }

    return await Hike.findAndCountAll(options);
};

export const getHike = async (hikeId: string) => {
    // TODO

    return await Hike.findByPk(hikeId);
};

export const createHike = async (hike: Hike, hikers?: string[]): Promise<string> => {
    const hikeRecord = await Hike.create({...hike});

    if (hikers) {
        const hikerRecords = new Array<Hiker>();

        for (const hiker in hikers) {
            const existingHiker = await Hiker.findOne({
                attributes: ['id', 'fullName'],
                where: {
                    fullName: hiker
                }
            })

            // If the hiker is already in the database, use their existing name so we avoid dups
            if (existingHiker) {
                hikerRecords.push(Hiker.build({
                    fullName: existingHiker.fullName
                }));
            } else {
                hikerRecords.push(Hiker.build({
                    fullName: hiker
                }));
            }
        }

        if (hikerRecords.length > 0) {
            await hikeRecord.addHikers(hikerRecords);
        }
    }

    return hikeRecord.id;
};

export const createPhoto = async (photoPath: string, hikeId: string) => {
    await Photo.create({
        filePath: `${hikeId}/${photoPath}`,
        hikeId
    });
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
