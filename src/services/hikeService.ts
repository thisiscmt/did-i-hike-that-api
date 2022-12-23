import {BindOrReplacements} from 'sequelize';

import {Hike} from '../db/models/hike.js';
import {Hiker} from '../db/models/hiker.js';
import {Photo} from '../db/models/photo.js';
import {HikeSearchParams} from '../models/models.js';
import {db} from '../db/models/index.js';

export const getHikes = async (searchParams: HikeSearchParams): Promise<{ rows: Hike[]; count: number }> =>
{
    const params: BindOrReplacements = [];
    let dateWhereClause: string;
    let sql = "Select `hikes`.`id`, `hikes`.`trail`, `hikes`.`dateOfHike`, `hikes`.`description`, `hikes`.`tags`, `Hikers`.`fullNames` ";
    sql = sql + "From `hikes` Left Outer Join (Select `hikeRosters`.`HikeId`, group_concat(`hikers`.`fullName`) As `fullNames` From `hikers` ";
    sql = sql + "Inner Join `hikeRosters` On `hikers`.`id` = `hikeRosters`.`HikerId` ";
    sql = sql + "Group By `hikeRosters`.`HikeId`) As `Hikers` On `Hikers`.`HikeId` = `hikes`.`id`";

    if (searchParams.startDate) {
        params.push(searchParams.startDate);

        if (searchParams.endDate) {
            dateWhereClause = " Where `hikes`.`dateOfHike` >= $1 And <= $2";
            params.push(searchParams.endDate);
        } else {
            dateWhereClause = " Where `hikes`.`dateOfHike` = $1"
        }

        sql = sql + dateWhereClause;
    } else if (searchParams.searchText) {
        sql = sql + " Where `hikes`.`trail` Like $3 Or `hikes`.`description` Like $3 Or `hikes`.`tags` Like $3 Or `fullNames` Like $3 Order By `hikes`.`dateOfHike` Desc Limit $1, $2";
        params.push(searchParams.page, searchParams.pageSize, `%${searchParams.searchText}%`);
    }

    const results = await db.query(sql,  {
        bind: params,
        mapToModel: true,
        model: Hike
    });

    results.forEach((hike: Hike) => {
        if (hike.fullNames) {
            hike.addHikers(getHikerList(hike.fullNames));
        }
    });

    return {
        rows: results,
        count: results.length
    };
};

const getHikerList = (fullNames: string): Hiker[] => {
    const hikerRecords = new Array<Hiker>();
    const names = fullNames.split(',');

    names.forEach((name: string) => {
        hikerRecords.push(Hiker.build({ fullName: name }));
    })

    return hikerRecords;
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
