import fs from 'fs';
import sharp from 'sharp';

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
