import { BindOrReplacements, FindOptions, Op } from 'sequelize';
import fs from 'fs';
import path from 'path';

import { Hike } from '../db/models/hike.js';
import { Hiker } from '../db/models/hiker.js';
import { Photo } from '../db/models/photo.js';
import { User } from '../db/models/user.js';
import { HikeSearchParams, PhotoMetadata } from '../models/models.js';
import { db } from '../db/models/index.js';
import * as UserService from '../services/userService.js';
import * as Constants from '../constants/constants.js';

export interface HikeDataValidation {
    invalid: boolean;
    fieldName?: string;
}

export const getHikes = async (searchParams: HikeSearchParams): Promise<{ rows: Hike[]; count: number }> => {
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

    if (searchParams.userName === Constants.DEMO_USER_NAME) {
        whereClause += " And `hikes`.`userId` = $userId"
        params['userId'] = searchParams.userId;
    } else {
        const demoUser = await UserService.getUserByEmail(Constants.DEMO_USER_NAME);

        if (demoUser) {
            whereClause += " And `hikes`.`userId` Is Not $userId"
            params['userId'] = demoUser.id;
        }
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

export const getDeletedHikes = async (): Promise<{ rows: Hike[] }> => {
    const result = await Hike.findAll({
        attributes: ['id', 'trail', 'dateOfHike', 'tags', 'createdAt', 'updatedAt'],
        include: [{
            model: Hiker,
            as: 'hikers',
            attributes: ['fullName'],
            through: {
                attributes: []
            }
        }, {
            model: User,
            as: 'user',
            attributes: ['email']
        }],
        where: { deleted: true }
    });

    return {
        rows: result,
    };
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

export const createHike = async (hike: Hike, hikers: string[]): Promise<string> => {
    const hikeRecord = await Hike.create(hike.toJSON());

    if (hikers.length > 0) {
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

export const deleteHike = async (hikeId: string, permanent?: boolean): Promise<void> => {
    if (permanent) {
        await deleteHikeData(hikeId);
    } else {
        await setHikeDeleteField(hikeId, true);
    }
};

export const undeleteHike = async (hikeId: string): Promise<void> => {
    await setHikeDeleteField(hikeId, false);
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

export const updatePhoto = async (photoMetadata: PhotoMetadata) => {
    await Photo.update({ ordinal: photoMetadata.ordinal, caption: photoMetadata.caption }, {
        where: {
            id: photoMetadata.id
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

export const getHikers = async (emailAddr?: string) => {
    const query: FindOptions = {
        attributes: ['fullName'],
        order: [['fullName', 'asc']]
    }

    if (emailAddr) {
        const demoHikers = ['Alice', 'Bob'];

        if (emailAddr.toLowerCase() === Constants.DEMO_USER_NAME) {
            query.where = {
                fullName: {
                    [Op.in]: demoHikers
                }
            }
        } else {
            query.where = {
                fullName: {
                    [Op.notIn]: demoHikers
                }
            }
        }
    }

    return Hiker.findAll(query);
};

export const getTags = async () => {
    const whereClause = {
        [Op.and]: [{ tags: {[Op.ne]: null }}, { tags: {[Op.ne]: '' }}]
    };

    const result = await Hike.findAll({
        attributes: ['tags'],
        group: ['tags'],
        where: whereClause
    });

    const tags: string[] = [];

    result.forEach((hike: Hike) => {
        if (hike.tags.includes(',')) {
            tags.push(...hike.tags.split(','));
        } else {
            tags.push(hike.tags);
        }
    });

    return [...new Set(tags.sort())];
};

export const validateHikeData = (hike: Hike, hikers: string[], photoMetadata: PhotoMetadata[]): HikeDataValidation => {
    if (hike.trail.length > 255) {
        return buildValidationResult(true, 'Trail');
    }

    if (hike.link.length > 255) {
        return buildValidationResult(true, 'Link');
    }

    if (hike.linkLabel.length > 255) {
        return buildValidationResult(true, 'Link label');
    }

    if (hike.conditions.length > 255) {
        return buildValidationResult(true, 'Conditions');
    }

    if (hike.crowds.length > 255) {
        return buildValidationResult(true, 'Crowds');
    }

    if (hike.tags.length > 255) {
        return buildValidationResult(true, 'Tags');
    }

    if (hikers.length > 0) {
        for (const item of hikers) {
            if (item.length > 255) {
                return buildValidationResult(true, 'Hiker');
            }
        }
    }

    if (photoMetadata.length > 0) {
        for (const item of photoMetadata) {
            if ((item.fileName || '').length > 255) {
                return buildValidationResult(true, 'Photo file name');
            }

            if (item.caption && item.caption.length > 255) {
                return buildValidationResult(true, 'Photo caption');
            }
        }
    }

    return buildValidationResult(false);
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
            const imagesPath = path.join(Constants.IMAGES_PATH, `${hikeId}_deleted`);

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

const buildValidationResult = (invalid: boolean, fieldName?: string): HikeDataValidation => {
    return { invalid, fieldName };
}

const setHikeDeleteField = async (hikeId: string, fieldValue: boolean) => {
    await Hike.update({ deleted: fieldValue }, {
        where: {
            id: hikeId
        }
    });
};
