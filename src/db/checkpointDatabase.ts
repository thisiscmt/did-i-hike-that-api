import { exec } from 'child_process';
import util from 'util';
import fs, { Dirent } from 'fs';
import path from 'path';
import schedule from 'node-schedule';
import { Sequelize } from 'sequelize';

import { dbOptions } from './models/index.js';
import * as SharedService from '../services/sharedService.js';
import * as Constants from '../constants/constants.js';

const execPromise = util.promisify(exec);
const logger = SharedService.getLogger();

const runCommand = async (cmd: string, errorMessage: string) => {
    try {
        const result = await execPromise(cmd);

        if (result.stderr) {
            logger.error(`${errorMessage}: ${result.stderr}`);
            return false;
        }

        if (result.stdout) {
            logger.info(`${result.stdout}`)
        }

        return true;
    } catch (error) {
        logger.error(`${errorMessage}:`, error);
        return false;
    }
};

const backupData = async () => {
    try {
        const backupPath = path.join(Constants.APP_DATA_PATH, 'backup');

        if (!fs.existsSync(Constants.APP_DATA_PATH)) {
            fs.mkdirSync(Constants.APP_DATA_PATH);
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

        if (backupDirectoryContents.length === Constants.MAX_DATABASE_BACKUPS) {
            backupDirectoryContents.sort((lValue: Dirent, rValue: Dirent) => {
                return Number(lValue.name) - Number(rValue.name);
            });

            fs.rmSync(path.join(backupPath, backupDirectoryContents[0].name), { recursive: true });
        }

        fs.mkdirSync(targetBackupDirectory);

        const filesToBackUp = [
            {
                sourceFilePath: path.join(Constants.APP_DATA_PATH, 'did_i_hike_that.sqlite3'),
                destFilePath: path.join(targetBackupDirectory, 'did_i_hike_that.sqlite3')
            },
            {
                sourceFilePath: path.join(Constants.APP_DATA_PATH, 'did_i_hike_that.sqlite3-shm'),
                destFilePath: path.join(targetBackupDirectory, 'did_i_hike_that.sqlite3-shm')
            },
            {
                sourceFilePath: path.join(Constants.APP_DATA_PATH, 'did_i_hike_that.sqlite3-wal'),
                destFilePath: path.join(targetBackupDirectory, 'did_i_hike_that.sqlite3-wal')
            }
        ];

        for (const fileToBackup of filesToBackUp) {
            try {
                fs.statSync(fileToBackup.sourceFilePath);
                fs.copyFileSync(fileToBackup.sourceFilePath, fileToBackup.destFilePath);
            } catch {
                // Do nothing since the file doesn't exist
            }
        }

        fs.cpSync(path.join(Constants.APP_DATA_PATH, 'images'), path.join(targetBackupDirectory, 'images'), { recursive: true });

        return true;
    } catch (error) {
        logger.error('Error performing backup:', error);
        return false;
    }
};

try {
    const rule = new schedule.RecurrenceRule();

    // Set the checkpoint process to run every week on Wednesday at 1:00 AM Pacific time
    rule.dayOfWeek = 3;
    rule.hour = 1;
    rule.minute = 0;
    rule.tz = 'Etc/GMT+8';

    schedule.scheduleJob(rule, async () => {
        let success = await runCommand('pm2 stop api', 'Error stopping the API service');

        if (!success) {
            return;
        }

        success = await backupData();

        if (!success) {
            return;
        }

        logger.info('Backup completed successfully');

        try {
            const db = new Sequelize(dbOptions);
            const result = await db.query('pragma wal_checkpoint(TRUNCATE);');
            const msg = 'Database checkpoint completed successfully';

            if (result && result.length > 0) {
                logger.info(msg, { metadata: result[0] });
            } else {
                logger.info(msg);
            }
        } catch (error) {
            logger.error('Error executing checkpoint command:', error);
        } finally {
            await runCommand('pm2 start api', 'Error starting the API service');
        }
    });
} catch (error) {
    logger.error('Error setting up DB checkpoint schedule:', error);
}
