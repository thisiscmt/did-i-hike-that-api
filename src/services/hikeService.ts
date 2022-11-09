import { FindAndCountOptions, Op } from 'sequelize';

import { Hike } from '../db/models/hike.js';
import { Hiker } from '../db/models/hiker.js';
import { Photo } from '../db/models/photo.js';
import {WhereOptions} from 'sequelize/types/model';

export const getHikes = async (page: number, pageSize: number, trail?: string, startDate?: Date, endDate?: Date):
    Promise<{ rows: Hike[]; count: number }> =>
{
    const options: FindAndCountOptions = {
        attributes: ['id', 'trail', 'dateOfHike', 'description', 'link', 'weather', 'crowds', 'tags'],
        raw: true
    };
    const whereClause: WhereOptions = {};

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
    const hikeRecord = await Hike.create(hike.toJSON());

    if (hikers) {
        const hikerRecords = new Array<Hiker>();
        let hikerRecord: Hiker;
        let hikerToAdd: string;

        for (const hiker of hikers) {
            const existingHiker = await Hiker.findOne({
                attributes: ['id', 'fullName'],
                where: {
                    fullName: hiker
                }
            })

            // If the hiker is already in the database, use their existing name so we avoid dups
            if (existingHiker) {
                hikerToAdd = existingHiker.fullName;

            } else {
                hikerToAdd = hiker;
            }

            hikerRecord = await Hiker.create({
                fullName: hikerToAdd
            });

            hikerRecords.push(hikerRecord);
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

export const updateHike = async (hike: Hike) => {
    // TODO

    await Hike.update({...hike}, {
        where: {
            id: hike.id
        }
    });
};

export const deleteHike = async (hikeId: string) => {
    await Hike.destroy({
        where: {
            id: hikeId
        }
    });
};
