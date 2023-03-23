import fs from 'fs';
import sharp from 'sharp';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import session from 'express-session';
import * as connectSequilize from 'connect-session-sequelize';

import {PhotoMetadata} from '../models/models';
import {db} from '../db/models/index.js';
import path from 'path';

const scryptAsync = promisify(scrypt);
const PHOTO_RESIZE_PERCENTAGE = 0.30;
const PHOTO_THUMBNAIL_SIZE = 250;

export const getSessionStore = () => {
    const sequelizeStore = connectSequilize.default(session.Store);

    return new sequelizeStore({
        db,
        tableName: 'sessions'
    });
};

export const resizePhoto = async (uploadFilePath: string, photoPath: string) => {
    const image = sharp(uploadFilePath);
    const metadata = await image.metadata();
    let moveFile = false;

    if (metadata.width && metadata.width > 1000) {
        const resizedImage = image.withMetadata().resize({
            width: Math.floor(metadata.width * PHOTO_RESIZE_PERCENTAGE),
            fit: 'contain'
        });

        if (metadata.format === 'jpeg') {
            await resizedImage.jpeg({ quality: 100 }).toFile(photoPath);
        } else {
            await resizedImage.toFile(photoPath);
        }
    } else {
        moveFile = true;
    }

    const thumbnail = image.withMetadata().resize({
        width: PHOTO_THUMBNAIL_SIZE,
        fit: 'contain'
    });
    const photoExt = path.extname(photoPath)
    const thumbnailPath = photoPath.replace(photoExt, `_thumbnail${photoExt}`);

    if (metadata.format === 'jpeg') {
        await thumbnail.jpeg({ quality: 100 }).toFile(thumbnailPath);
    } else {
        await thumbnail.toFile(thumbnailPath);
    }

    if (moveFile) {
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
