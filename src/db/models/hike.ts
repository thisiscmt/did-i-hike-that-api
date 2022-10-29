import { Model, Optional } from 'sequelize';

export interface HikeAttributes {
    id: string;
    trail: string;
    description: string;
    dateOfHike: Date;
    link: string;
    weather: string;
    crowds: string;
    tags: string;
}

type HikeCreationAttributes = Optional<HikeAttributes, 'id'>

export interface HikeRecord extends Model<HikeAttributes, HikeCreationAttributes> {
    createdAt?: Date;
    updatedAt?: Date;
}
