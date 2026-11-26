import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export function imageFileFilter(
    _req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
) {
    const isPdf =
        file.mimetype === 'application/pdf' &&
        extname(file.originalname).toLowerCase() === '.pdf';

    if (!isPdf) {
        return cb(
            new BadRequestException('Apenas arquivos PDF são permitidos'),
            false,
        );
    }

    return cb(null, true);
}
