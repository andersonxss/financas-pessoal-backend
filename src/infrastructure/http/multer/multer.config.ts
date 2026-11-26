import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerConfig = {
    storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
            const uniqueName =
                Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${uniqueName}${extname(file.originalname)}`);
        },
    }),

    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
};
