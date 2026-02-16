import { exec } from 'child_process';
import util from 'util';
import fs, { Dirent } from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';

import { dbOptions } from './models/index.js';
import { APP_DATA_PATH, MAX_DATABASE_BACKUPS } from '../constants/constants.js';

const execPromise = util.promisify(exec);

const runCommand = async (cmd: string, errorMessage: string) => {
    try {
        const result = await execPromise(cmd);

        if (result.stderr) {
            console.log(`${errorMessage}: ${result.stderr}`);
            return false;
        }

        if (result.stdout) {
            console.log(`${result.stdout}`)
        }

        return true;
    } catch (error) {
        console.log(`${errorMessage}: %o`, error);
        return false;
    }
};

const backupDatabase = async () => {
    try {
        const backupPath = path.join(APP_DATA_PATH, 'backup');

        if (!fs.existsSync(APP_DATA_PATH)) {
            fs.mkdirSync(APP_DATA_PATH);
        }

        if (!fs.existsSync(backupPath)) {
            fs.mkdirSync(backupPath);
        }

        const targetBackupDirectory = path.join(backupPath, Date.now().toString());
        let backupDirectoryContents = await fs.promises.readdir(backupPath, { withFileTypes: true });

        backupDirectoryContents = backupDirectoryContents.reduce((directories: Dirent[], dirEntry: Dirent) => {
            if (dirEntry.isDirectory()) {
                directories.push(dirEntry);
            }

            return directories;
        }, []);

        if (backupDirectoryContents.length === MAX_DATABASE_BACKUPS) {
            backupDirectoryContents.sort((lValue: Dirent, rValue: Dirent) => {
                return Number(lValue.name) - Number(rValue.name);
            });

            fs.rmSync(path.join(backupPath, backupDirectoryContents[0].name), { recursive: true });
        }

        fs.mkdirSync(targetBackupDirectory);

        const filesToBackUp = [
            {
                sourceFilePath: path.join(APP_DATA_PATH, 'did_i_hike_that.sqlite3'),
                destFilePath: path.join(targetBackupDirectory, 'did_i_hike_that.sqlite3')
            },
            {
                sourceFilePath: path.join(APP_DATA_PATH, 'did_i_hike_that.sqlite3-shm'),
                destFilePath: path.join(targetBackupDirectory, 'did_i_hike_that.sqlite3-shm')
            },
            {
                sourceFilePath: path.join(APP_DATA_PATH, 'did_i_hike_that.sqlite3-wal'),
                destFilePath: path.join(targetBackupDirectory, 'did_i_hike_that.sqlite3-wal')
            }
        ];

        for (const fileToBackup of filesToBackUp) {
            if (fs.statSync(fileToBackup.sourceFilePath)) {
                fs.copyFileSync(fileToBackup.sourceFilePath, fileToBackup.destFilePath);
            }
        }

        return true;
    } catch (error) {
        console.log('Error backing up database: %o', error);
        return false;
    }
};

try {
    const dbCommitinterval = Number(process.env.DIHT_DB_COMMIT_INTERVAL) || 86400000;  // 24 hour default

    setInterval(async () => {
        let success = await runCommand('pm2 stop api', 'Error stopping the API service');

        if (!success) {
            return;
        }

        success = await backupDatabase();

        if (!success) {
            return;
        }

        console.log('Database backup completed successfully');

        try {
            const db = new Sequelize(dbOptions);
            const result = await db.query('pragma wal_checkpoint(TRUNCATE);');
            console.log('Database checkpoint completed successfully');

            if (result && result.length > 0) {
                console.log('Checkpoint result: %o', result[0]);
            }
        } catch (error) {
            console.log('Error executing checkpoint command: %o', error);
        }

        await runCommand('pm2 start api', 'Error starting the API service');
    }, dbCommitinterval);
} catch (error) {
   console.log('Error setting up DB checkpoint timer interval: %o', error);
}
