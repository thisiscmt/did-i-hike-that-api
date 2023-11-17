import {BindOrReplacements} from 'sequelize';
import fs from 'fs';
import path from 'path';

import { Hike } from '../db/models/hike.js';
import { Hiker } from '../db/models/hiker.js';
import { Photo } from '../db/models/photo.js';
import { User } from '../db/models/user.js';
import { HikeSearchParams } from '../models/models.js';
import { db} from '../db/models/index.js';
import * as SharedService from '../services/sharedService.js';
import { IMAGES_PATH } from '../constants/constants.js';

export const getHikes = async (searchParams: HikeSearchParams): Promise<{ rows: Hike[]; count: number }> =>
{
    const params: BindOrReplacements = {};
    let whereClause: string;

    let sql = "Select `hikes`.`id`, `hikes`.`trail`, `hikes`.`dateOfHike`, `hikes`.`endDateOfHike`, `hikes`.`description`, `hikes`.`tags`, `Hikers`.`fullNames`, `Photos`.`filePath`, `Photos`.`caption` ";
    sql += "From `hikes` Left Outer Join (Select `hikeRosters`.`HikeId`, group_concat(`hikers`.`fullName`) As `fullNames` From `hikers` ";
    sql += "Inner Join `hikeRosters` On `hikers`.`id` = `hikeRosters`.`HikerId` ";
    sql += "Group By `hikeRosters`.`HikeId`) As `Hikers` On `Hikers`.`HikeId` = `hikes`.`id` ";
    sql += "Left Outer Join (Select * From (Select `photos`.`hikeId`, `photos`.`filePath`, `photos`.`caption`, `photos`.`createdAt` From `photos` Order By `photos`.`ordinal` Asc, `photos`.`createdAt` Asc) Group By hikeId) As `Photos` On `Photos`.`hikeId` = `hikes`.`id`";

    if (searchParams.startDate) {
        params['startDate'] = searchParams.startDate;

        if (searchParams.endDate) {
            whereClause = " Where `hikes`.`dateOfHike` >= $startDate And <= $endDate";
            params['endDate'] = searchParams.endDate;
        } else {
            whereClause = " Where `hikes`.`dateOfHike` = $startDate"
        }

        whereClause += " And NOT COALESCE(`hikes`.`deleted`, 0)";
    } else if (searchParams.searchText) {
        whereClause = " Where (`hikes`.`trail` Like $searchText Or `hikes`.`description` Like $searchText Or `hikes`.`tags` Like $searchText Or `fullNames` Like $searchText) And NOT COALESCE(`hikes`.`deleted`, 0)";
        params['searchText'] = `%${searchParams.searchText}%`;
    } else {
        whereClause = "Where NOT COALESCE(`hikes`.`deleted`, 0)";
    }

    sql += whereClause;
    const resultForCount = await db.query(sql,  { bind: params, mapToModel: true, model: Hike });
    const count = resultForCount.length;

    params['offset'] = searchParams.page;
    params['limit'] = searchParams.pageSize;
    sql += " Order By `hikes`.`dateOfHike` Desc Limit $offset, $limit";
    const result = await db.query(sql,  { bind: params, mapToModel: true, model: Hike });

    return {
        rows: result,
        count
    };
};

export const getDeletedHikes = async (): Promise<Hike[]> => {
    return Hike.findAll({
        attributes: ['id', 'trail', 'description'],
        where: { deleted: true }
    });
};

export const hikeExists = async (hikeId: string): Promise<boolean> => {
    const hike = await Hike.findByPk(hikeId, {
        attributes: ['id']
    });

    return !!hike;
};

export const getHike = async (hikeId: string): Promise<Hike | null> => {
    return await Hike.findByPk(hikeId, {
        include: [{
            model: Photo,
            as: 'photos',
            separate: true,  // Required to order the records from a child table
            attributes: ['id', 'caption', 'ordinal', 'fileName', 'filePath'],
            order: [['ordinal', 'asc'], ['createdAt', 'asc']]
        }, {
            model: Hiker,
            as: 'hikers',
            attributes: ['fullName'],
            through: {
                attributes: []
            }
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

    await setHikers(hike, hikers || []);
};

export const deleteHike = async (hikeId: string, permanent?: boolean): Promise<boolean> => {
    let success;

    if (permanent) {
        success = await deleteHikeData(hikeId);
    } else {
        await Hike.update({ deleted: true }, {
            where: {
                id: hikeId
            }
        });

        success = true;
    }

    return success;
};

export const createPhoto = async (fileName: string, hikeId: string, ordinal: number, caption?: string) => {
    await Photo.create({
        fileName,
        filePath: `${hikeId}/${fileName}`,
        ordinal,
        caption,
        hikeId
    });
};

export const updatePhoto = async (photoId: string, ordinal: number, caption?: string) => {
    await Photo.update({ ordinal, caption }, {
        where: {
            id: photoId
        }
    });
};

export const deletePhoto = async (photoId: string) => {
    await Photo.destroy({
        where: {
            id: photoId
        }
    });
};

export const getHikers = async () => {
    return Hiker.findAll({
        attributes: ['fullName'],
        order: [['fullName', 'asc']]
    });
};

export const loginUser = async (email: string, password: string) => {
    let success = false;

    const user = await User.findOne({
        where: {
            email
        }
    });

    if (user) {
        success = await SharedService.passwordMatch(user.password, password);

        if (success) {
            await User.update({ lastLogin: new Date().getTime() }, {
                where: {
                    id: user.id
                }
            });
        }
    }

    return success;
};

export const validUser = async (email: string) => {
    let valid = false

    const userRecord = await User.findOne({
        where: {
            email
        }
    });

    if (userRecord) {
        valid = true;
    }

    return valid;
};

export const createUser = async (name: string, email: string, password: string) => {
    const storedPassword = await SharedService.hashPassword(password);

    await User.create({
        name,
        email,
        password: storedPassword,
        lastLogin: 0
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
                    fullName: hiker.trim()
                }
            })

            // If the hiker is already in the database, use their existing name so we avoid dups
            if (existingHiker) {
                hikerRecords.push(existingHiker);
            } else {
                hikerRecord = await Hiker.create({
                    fullName: hiker.trim()
                });
                hikerRecords.push(hikerRecord);
            }
        }

        if (hikerRecords.length > 0) {
            await hikeRecord.addHikers(hikerRecords);
        }
    }
};

const deleteHikeData = async (hikeId: string) => {
    const hike = await getHike(hikeId);
    let hikeDeleted = false;

    if (hike) {
        if (hike.photos) {
            const photoIds = hike.photos.map((photo: Photo) => photo.id);
            const imagesPath = path.join(IMAGES_PATH, `${hikeId}_deleted`);

            if (fs.existsSync(imagesPath)) {
                fs.rmSync(imagesPath, { recursive: true });
            }

            await Photo.destroy({
                where: {
                    id: photoIds
                }
            });
        }

        await Hike.destroy({
            where: {
                id: hikeId
            }
        });

        hikeDeleted = true;
    }

    return hikeDeleted;
};
