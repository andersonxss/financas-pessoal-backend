import { Injectable } from '@nestjs/common';
import { AIService } from '../../../domain/services/ai.service';
import { GoogleGenAI } from '@google/genai';
import { ConfigService } from '@nestjs/config';
import { googleAIConfig } from './google.config';

@Injectable()
export class GoogleGenAIService implements AIService {
    private client: GoogleGenAI;
    private model: string;

    constructor(private readonly configService: ConfigService) {
        const config = googleAIConfig(configService);

        this.client = new GoogleGenAI({ apiKey: config.apiKey });
        this.model = config.model;
    }

    async generateText(prompt: string | any): Promise<string> {
        const model = this.client.models.generateContent({
            model: this.model,
            contents: prompt,
        });

        const result = await model;

        return result.text || '';
    }
}