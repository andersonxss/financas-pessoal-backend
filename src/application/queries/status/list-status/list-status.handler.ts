import { ICommandHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListStatusQuery } from "./list-status.query";
import * as Repositories from "@repositories";
import { Status } from "@entities";

@QueryHandler(ListStatusQuery)
export class ListStatusHandler implements ICommandHandler<ListStatusQuery> {
    constructor(
        @Inject('StatusRepository')
        private readonly repository: Repositories.IStatusRepository,
    ) { }

    async execute(): Promise<Status[]> {
        const status = await this.repository.findAll();
        return status
    }
}