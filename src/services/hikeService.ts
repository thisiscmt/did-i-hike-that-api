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
        await setHikers(hikeRecord, hikers);
    }

    return hikeRecord.id;
};

export const updateHike = async (hike: Hike, hikers?: string[]) => {
    await Hike.update(hike.toJSON(), {
        where: {
            id: hike.id
        }
    });

    const hikeRecord = await Hike.findOne({
        where: {
            id: hike.id
        }
    })

    if (hikers) {
        await setHikers(hikeRecord, hikers);
    }
};

export const deleteHike = async (hikeId: string) => {
    await Hike.destroy({
        where: {
            id: hikeId
        }
    });
};

export const getPhoto = async (fileName: string, hikeId: string) => {
    return await Photo.findOne({
        where: {
            fileName,
            hikeId
        }
    });
};

export const createPhoto = async (fileName: string, filePath: string, hikeId: string) => {
    await Photo.create({
        fileName,
        filePath: `${hikeId}/${filePath}`,
        hikeId
    });
};

export const deletePhoto = async (photoId: string) => {
    await Photo.destroy({
        where: {
            id: photoId
        }
    });
};

const setHikers = async (hikeRecord: Hike | null, hikers: string[]) => {
    const hikerRecords = new Array<Hiker>();
    let hikerRecord: Hiker;

    if (hikeRecord) {
        const currentHikers = await hikeRecord.getHikers();
        await hikeRecord.removeHikers(currentHikers);

        for (const hiker of hikers) {
            const existingHiker = await Hiker.findOne({
                attributes: ['id', 'fullName'],
                where: {
                    fullName: hiker
                }
            })

            // If the hiker is already in the database, use their existing name so we avoid dups
            if (existingHiker) {
                hikerRecords.push(existingHiker);
            } else {
                hikerRecord = await Hiker.create({
                    fullName: hiker
                });
                hikerRecords.push(hikerRecord);
            }
        }

        if (hikerRecords.length > 0) {
            await hikeRecord.addHikers(hikerRecords);
        }
    }
};
