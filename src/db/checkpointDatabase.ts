import {exec} from 'child_process';

import { db } from './models/index.js';

try {
    const dbCommitinterval = Number(process.env.DIHT_DB_COMMIT_INTERVAL) || 15000; // 43200000;  // 12 hour default

    setInterval(() => {
        exec('pm2 stop api', (error, stdout, stderr) => {
            if (error) {
                console.log(`Error stopping the API server: ${error.message}`);
                return;
            }

            if (stderr) {
                console.log(`Error (stderr): ${stderr}`);
                return;
            }

            db.query('pragma wal_checkpoint(TRUNCATE);').then(() => {
                console.log('Database checkpoint completed successfully');

                exec('pm2 start api', (error, stdout, stderr) => {
                    if (error) {
                        console.log(`Error starting the API server: ${error.message}`);
                        return;
                    }

                    if (stderr) {
                        console.log(`Error (stderr): ${stderr}`);
                        return;
                    }
                });
            }).catch((error) => {
                console.log('Error executing database checkpoint: %o', error.message);
            });
        });
    }, dbCommitinterval);
} catch (error) {
    console.log('Error setting up DB checkpoint timer interval: %o', error);
}
