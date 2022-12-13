import {FindAndCountOptions, Includeable, Op, Sequelize} from 'sequelize';

import {Hike} from '../db/models/hike.js';
import {Hiker} from '../db/models/hiker.js';
import {Photo} from '../db/models/photo.js';
import {WhereOptions} from 'sequelize/types/model';

export const getHikes = async (page: number, pageSize: number, trail?: string, startDate?: Date, endDate?: Date, hiker?: string,
                               description?: string, tag?: string):
    Promise<{ rows: Hike[]; count: number }> =>
{
    const whereClause: WhereOptions = {};
    const hikersModel: Includeable = { model: Hiker, as: 'hikers', attributes: ['fullName'], through: {attributes: []} };

    if (trail) {
        whereClause.trail = Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('trail')), 'LIKE', '%' + trail + '%');
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

    if (hiker) {
        hikersModel.where = {
            fullName: Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('fullName')), 'LIKE', '%' + hiker + '%')
        };
    }

    if (description) {
        whereClause.description = Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('description')), 'LIKE', '%' + description + '%');
    }

    if (tag) {
        whereClause.tags = Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('tags')), 'LIKE', '%' + tag + '%');
    }

    const options: FindAndCountOptions = {
        attributes: ['id', 'trail', 'dateOfHike', 'description', 'tags'],
        order: [
            ['dateOfHike', 'DESC']
        ],
        include: [hikersModel],
        distinct: true
    };

    options.offset = (page - 1) * pageSize;
    options.limit = pageSize;

    if (Object.keys(whereClause).length > 0) {
        options.where = whereClause;
    }

    return await Hike.findAndCountAll(options);
};

export const hikeExists = async (hikeId: string): Promise<boolean> => {
    const hike = await Hike.findByPk(hikeId, {
        attributes: ['id']
    });

    return !!hike;
};

export const getHike = async (hikeId: string) => {
    return await Hike.findByPk(hikeId, {
        include: [{
            model: Photo,
            as: 'photos'
        }, {
            model: Hiker,
            as: 'hikers'
        }]
    });
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

export const createPhoto = async (fileName: string, hikeId: string, caption?: string) => {
    await Photo.create({
        fileName,
        filePath: `${hikeId}/${fileName}`,
        caption,
        hikeId
    });
};

export const updatePhoto = async (photoId: string, caption?: string) => {
    if (caption) {
        await Photo.update({ caption }, {
            where: {
                id: photoId
            }
        });
    }
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
