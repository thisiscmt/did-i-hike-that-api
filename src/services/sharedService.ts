import fs from 'fs';
import sharp from 'sharp';

import {PhotoMetadata} from '../models/models';

const IMAGE_RESIZE_PRECENTAGE = 0.50;

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

export const encrypt = async (data: string) => {
    const crypto = await import('node:crypto');
    const initVector = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', process.env.DIHT_SECURITY_KEY || '', initVector);

    let encryptedData = cipher.update(data, 'utf-8', 'hex');
    encryptedData += cipher.final('hex');

    return encryptedData;
};

export const decrypt = async (encryptedData: string) => {
    const crypto = await import('node:crypto');
    const initVector = crypto.randomBytes(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', process.env.DIHT_SECURITY_KEY || '', initVector);

    let data = decipher.update(encryptedData, 'hex', 'utf-8');
    data += decipher.final('utf8');

    return data;
}
