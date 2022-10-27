import { Model, Op } from 'sequelize';

import { Hike } from '../db/models';
import {HikeAttributes, HikeRecord} from '../db/models/hike';

export const getHikes = async (page: number, pageSize: number, trail?: string, startDate?: Date, endDate?: Date):
    Promise<{ rows: Model<HikeRecord, HikeAttributes>[]; count: number }> =>
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
        where: whereClause
    });
};

