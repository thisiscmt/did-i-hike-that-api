import { CreationOptional, InferAttributes, InferCreationAttributes, Model } from 'sequelize';

export class Session extends Model<InferAttributes<Session>, InferCreationAttributes<Session>> {
    declare sid: string;
    declare expires: Date;
    declare data: string;
    declare createdAt: CreationOptional<Date>;
    declare updatedAt: CreationOptional<Date>;
}
