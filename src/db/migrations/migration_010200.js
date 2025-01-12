import { DataTypes } from 'sequelize';

async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('users', 'fullName', { type: DataTypes.STRING }, { transaction });
        await queryInterface.addColumn('users', 'role', { type: DataTypes.STRING, defaultValue: 'Standard' }, { transaction });
        await queryInterface.sequelize.query("Update Users Set role = 'Admin' Where email = 'thisiscmt@gmail.com'", { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.removeColumn('users', 'fullName', { transaction });
        await queryInterface.removeColumn('users', 'role', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export { up, down };
