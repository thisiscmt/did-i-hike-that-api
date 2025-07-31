import { Hike } from '../models/hike.js';

async function up({ context: queryInterface }) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
        const stateParkHikes = await queryInterface.sequelize.query("Select * From hikes Where tags Like 'state park' And substr(dateOfHike, 0, 5) = '2025'", {
            mapToModel: true,
            model: Hike
        });

        if (stateParkHikes.length === 0) {
            await transaction.rollback();
            return;
        }


        for (const hikeRec of stateParkHikes) {
            const newTags = hikeRec.tags.replace('state park', 'state park 2025');

            await queryInterface.sequelize.query(`Update hikes Set tags = '${newTags}' Where id = '${hikeRec.id}'`, { transaction });
        }

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
