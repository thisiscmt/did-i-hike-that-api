import { CreationOptional, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

import { Hike } from './hike';

export class Photo extends Model<InferAttributes<Photo>, InferCreationAttributes<Photo>> {
    declare id: CreationOptional<string>;
    declare filePath: string;
    declare hikeId: ForeignKey<Hike['id']>;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}
