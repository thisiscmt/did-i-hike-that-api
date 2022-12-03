import {ISizeCalculationResult} from 'image-size/dist/types/interface';
import sizeOf from 'image-size';

export const getFileDimensions = (filePath: string): Promise<ISizeCalculationResult> => {
    return new Promise((resolve, reject) => {
        sizeOf(filePath, (error, dimensions) => {
            if (error) {
                reject(error);
            }

            if (dimensions) {
                resolve(dimensions);
            } else {
                reject(new Error(`Unable to retrieve dimensions from file ${filePath}`));
            }
        });
    });
};
