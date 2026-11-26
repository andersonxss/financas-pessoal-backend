import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetStatusQuery } from "./get-status.query";
import * as Repositories from "@repositories";
import { Status } from "@entities";
import { StatusNotFound } from "@errors";

@QueryHandler(GetStatusQuery)
export class GetStatusHandler implements ICommandHandler<GetStatusQuery> {
    constructor(
        @Inject('StatusRepository')
        private readonly repository: Repositories.IStatusRepository,
    ) { }

    async execute(command: GetStatusQuery): Promise<Status> {
        const status = await this.repository.findById(command.id);
        if (!status) {
            throw new StatusNotFound();
        }
        return status;
    }
}