import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

export class Hiker extends Model<InferAttributes<Hiker>, InferCreationAttributes<Hiker>> {
    declare id: CreationOptional<string>;
    declare firstName: string;
    declare lastName: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}
