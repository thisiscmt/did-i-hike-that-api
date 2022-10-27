import { Model, Optional } from 'sequelize';

export interface HikerAttributes {
    id: string;
    firstName: string;
    lastName: string;
}

type HikerCreationAttributes = Optional<HikerAttributes, 'id'>

export interface HikerRecord extends Model<HikerAttributes, HikerCreationAttributes>, HikerAttributes {
    createdAt?: Date;
    updatedAt?: Date;
}
