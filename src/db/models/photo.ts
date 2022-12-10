import { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

import { Hike } from './hike.js';

export class Photo extends Model<InferAttributes<Photo>, InferCreationAttributes<Photo>> {
    declare id: CreationOptional<string>;
    declare fileName: string;
    declare filePath: string;
    declare caption: CreationOptional<string>;
    declare hikeId: ForeignKey<Hike['id']>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}
