import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

export class Hiker extends Model<InferAttributes<Hiker>, InferCreationAttributes<Hiker>> {
    declare id: CreationOptional<string>;
    declare fullName: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}
