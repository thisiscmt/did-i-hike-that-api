import { DataTypes } from 'sequelize';

async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('hikes', 'distance', { type: DataTypes.STRING }, { transaction });
        await queryInterface.addColumn('hikes', 'elevationGain', { type: DataTypes.STRING }, { transaction });
        await queryInterface.addColumn('hikes', 'timeUp', { type: DataTypes.STRING }, { transaction });
        await queryInterface.addColumn('hikes', 'timeDown', { type: DataTypes.STRING }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.removeColumn('hikes', 'distance', { transaction });
        await queryInterface.removeColumn('hikes', 'elevationGain', { transaction });
        await queryInterface.removeColumn('hikes', 'timeUp', { transaction });
        await queryInterface.removeColumn('hikes', 'timeDown', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export { up, down };
