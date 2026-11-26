export class UploadFileDespesasCommand {
    constructor(
        public readonly file: Express.Multer.File,
        public readonly vencimento: string,
        public readonly tipo: string,
        public readonly tenantId: string
    ) { }
}
