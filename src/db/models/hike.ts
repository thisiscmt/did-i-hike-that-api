import {
    CreationOptional,
    HasManyAddAssociationsMixin,
    HasManyGetAssociationsMixin,
    HasManyRemoveAssociationsMixin,
    InferAttributes,
    InferCreationAttributes,
    Model,
    NonAttribute,
} from 'sequelize';

import { Photo } from './photo.js';
import { Hiker } from './hiker.js';

export class Hike extends Model<InferAttributes<Hike, { omit: 'photos' | 'hikers' }>, InferCreationAttributes<Hike, { omit: 'photos' | 'hikers' }>> {
    declare id: CreationOptional<string>;
    declare trail: string;
    declare description: string;
    declare dateOfHike: Date;
    declare endDateOfHike: CreationOptional<Date>;
    declare link: string;
    declare linkLabel: string;
    declare conditions: string;
    declare crowds: string;
    declare tags: string;
    declare deleted: boolean;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
    declare userId?: string;
    declare photos?: NonAttribute<Photo[]>;
    declare hikers?: NonAttribute<Hiker[]>;

    declare getPhotos: HasManyGetAssociationsMixin<Photo>;
    declare getHikers: HasManyGetAssociationsMixin<Hiker>;
    declare addHikers: HasManyAddAssociationsMixin<Hiker, string>;
    declare removeHikers: HasManyRemoveAssociationsMixin<Hiker, string>;
}
