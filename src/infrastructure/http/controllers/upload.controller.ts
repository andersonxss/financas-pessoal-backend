import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    HttpException,
    HttpStatus,
    ParseFilePipeBuilder,
    BadRequestException,
    Query,
    Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../multer/multer.config';
import { imageFileFilter } from '../multer/file-filter';
import { CommandBus } from '@nestjs/cqrs';
import { UploadFileDespesasCommand } from '@commands';
import { AppError } from '@errors';
import { open, unlink } from 'node:fs/promises';
import { AuthenticatedUser } from 'src/infrastructure/auth';

@Controller('files')
export class UploadController {
    constructor(private readonly commandBus: CommandBus) { }

    @Post('despesas')
    @UseInterceptors(
        FileInterceptor('file', {
            ...multerConfig,
            fileFilter: imageFileFilter,
        }),
    )
    async upload(
        @Req() request: Request & { user: AuthenticatedUser },
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
                .build({
                    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
                    fileIsRequired: true,
                }),
        )
        file: Express.Multer.File,
        @Query('vencimento') vencimento: string,
        @Query('tipo') tipo: string,
    ) {
        try {


            await this.validatePdfSignature(file);

            const upload = await this.commandBus.execute(
                new UploadFileDespesasCommand(file, vencimento, tipo, request.user.tenantId),
            );
            return upload;
        } catch (error) {
            const appError = new AppError(error);
            throw new HttpException(appError.message, appError.status);
        }
    }

    private async validatePdfSignature(file: Express.Multer.File): Promise<void> {
        const fileHandle = await open(file.path, 'r');
        const signature = Buffer.alloc(5);
        let isPdf = false;

        try {
            const { bytesRead } = await fileHandle.read(signature, 0, 5, 0);
            isPdf = bytesRead === 5 && signature.toString('ascii') === '%PDF-';
        } finally {
            await fileHandle.close();
        }

        if (!isPdf) {
            await unlink(file.path).catch(() => undefined);
            throw new BadRequestException(
                'O conteúdo do arquivo não corresponde a um PDF válido',
            );
        }
    }
}
