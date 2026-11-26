export interface AIService {
    generateText(prompt: string | any): Promise<string>;
}