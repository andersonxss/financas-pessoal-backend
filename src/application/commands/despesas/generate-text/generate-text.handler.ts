import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { GenerateTextCommand } from "./generate-text.command";
import type { AIService } from "@domain/services";
import { Inject } from "@nestjs/common";

@CommandHandler(GenerateTextCommand)
export class GenerateTextHandler implements ICommandHandler<GenerateTextCommand> {
    constructor(
        @Inject('AIService') private readonly aiService: AIService,
    ) { }

    async execute(command: GenerateTextCommand) {
        const result = await this.aiService.generateText(
            command.prompt,
        );


        return result;
    }
}