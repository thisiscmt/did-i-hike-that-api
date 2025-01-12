import { DataTypes } from 'sequelize';

import { User } from '../models/user.js';

async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        const hikeTableDefinition =  await queryInterface.describeTable('hikes');

        if (!hikeTableDefinition.userId) {
            // Including the transaction here will make Sequelize aware of the new column so we can update it later
            await queryInterface.addColumn('hikes', 'userId', { type: DataTypes.STRING }, { transaction });
        }

        const chrisUser = await queryInterface.sequelize.query("Select * From Users Where email = 'thisiscmt@gmail.com'", {
            mapToModel: true,
            model: User
        });

        const kimUser = await queryInterface.sequelize.query("Select * From Users Where email = 'kimmacleod@hotmail.com'", {
            mapToModel: true,
            model: User
        });

        const sql = 'Select hikes.id, hikers.fullNames from hikes Left Outer Join (Select hikeRosters.HikeId, group_concat(trim(hikers.fullName)) As fullNames ' +
            'From hikers Inner Join hikeRosters On hikers.id = hikeRosters.HikerId Group By hikeRosters.HikeId) As hikers On hikers.HikeId = hikes.id ' +
            'Where hikes.deleted = 0';

        const hikes = await queryInterface.sequelize.query(sql);

        if (chrisUser.length === 0 || kimUser.length === 0 || hikes.length === 0 || (hikes.length > 0 && hikes[0].length === 0)) {
            await transaction.rollback();
            return;
        }

        let userId;
        let fullNames;

        for (const hike of hikes[0]) {
            fullNames = hike.fullNames;

            if (fullNames && !fullNames.toLowerCase().includes('chris')) {
                userId = kimUser[0].id;
            } else {
                userId = chrisUser[0].id;
            }

            // We include the transaction object since we need to update the newly-added column
            await queryInterface.sequelize.query(`Update hikes Set userId = '${userId}' Where id = '${hike.id}'`, { transaction });
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function down({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.removeColumn('hikes', 'userId', { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

export { up, down };
