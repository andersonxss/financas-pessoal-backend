import { Module } from "@nestjs/common";
import { GenerateTextHandler } from "@commands";
import { GoogleGenAIService } from "../infrastructure/ai/google/google-genai.service";

@Module({
    providers: [
        GenerateTextHandler,
        {
            provide: 'AIService',
            useClass: GoogleGenAIService,
        },
    ],
    exports: ['AIService'],
})
export class AIModule { }