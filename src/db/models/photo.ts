import { Model, Optional } from 'sequelize';

export interface PhotoAttributes {
    id: string;
    filePath: string;
    hikeId: string;
}

type PhotoCreationAttributes = Optional<PhotoAttributes, 'id'>

export interface PhotoRecord extends Model<PhotoAttributes, PhotoCreationAttributes>, PhotoAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}
