import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    declare id: CreationOptional<string>;
    declare name: string;
    declare email: string;
    declare password: string;
    declare role: string;
    declare lastLogin: number;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}
