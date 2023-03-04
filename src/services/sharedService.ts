import fs from 'fs';
import sharp from 'sharp';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import session from 'express-session';
import * as connectSequilize from 'connect-session-sequelize';

import {PhotoMetadata} from '../models/models';
import {db} from '../db/models/index.js';

const scryptAsync = promisify(scrypt);
const IMAGE_RESIZE_PRECENTAGE = 0.50;

export const getSessionStore = () => {
    const sequelizeStore = connectSequilize.default(session.Store);

    return new sequelizeStore({
        db,
        tableName: 'sessions'
    });
};

export const resizeImage = async (uploadFilePath: string, photoPath: string) => {
    const image = sharp(uploadFilePath);
    const metadata = await image.metadata();

    if (metadata.width && metadata.width > 1000) {
        const resizedImage = image.withMetadata().resize({
            width: Math.floor(metadata.width * IMAGE_RESIZE_PRECENTAGE),
            fit: 'contain'
        });

        if (metadata.format === 'jpeg') {
            await resizedImage.jpeg({ quality: 100 }).toFile(photoPath);
        } else {
            await resizedImage.toFile(photoPath);
        }
    } else {
        fs.renameSync(uploadFilePath, photoPath);
    }
};

export const getCaption = (fileName: string, photos: PhotoMetadata[]) => {
    let caption: string | undefined;
    let metadata: PhotoMetadata | undefined;

    if (photos.length > 0) {
        metadata = photos.find((photo: PhotoMetadata) => photo.fileName === fileName);

        if (metadata) {
            caption = metadata.caption || '';
        }
    }

    return caption;
}

export const getDateValue = (value: string) => {
    const newDate = new Date(value);
    const monthPart = (newDate.getMonth() + 1).toString().padStart(2, '0');
    const dayPart = newDate.getDate().toString().padStart(2, '0');

    return `${newDate.getFullYear()}-${monthPart}-${dayPart}`;
};

export const hashPassword = async (password: string) => {
    const salt = randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;

    return `${buf.toString('hex')}.${salt}`;
};

export const passwordMatch = async (storedPassword: string, suppliedPassword: string): Promise<boolean> => {
    const [hashedPassword, salt] = storedPassword.split('.');
    const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
    const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;

    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
};
