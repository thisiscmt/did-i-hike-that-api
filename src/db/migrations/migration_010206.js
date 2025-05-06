import { Hiker } from '../models/hiker.js';

async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        const samHiker = await queryInterface.sequelize.query("Select * From hikers Where fullName = 'sam'", {
            mapToModel: true,
            model: Hiker
        });

        if (samHiker.length === 0) {
            await transaction.rollback();
            return;
        }

        await queryInterface.sequelize.query(`Update hikers Set FullName = 'Sam' Where id = '${samHiker[0].id}'`, { transaction });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function down() {
    console.log('No changes made.');
}

export { up, down };
