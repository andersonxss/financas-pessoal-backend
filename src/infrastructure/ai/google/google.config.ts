import { ConfigService } from '@nestjs/config';

export const googleAIConfig = (config: ConfigService) => ({
    apiKey: config.get<string>('GOOGLE_API_KEY'),
    model: config.get<string>('GOOGLE_MODEL', 'gemini-pro'),
    temperature: config.get<number>('GOOGLE_TEMPERATURE', 0.7),
});