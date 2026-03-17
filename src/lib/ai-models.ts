export interface AIModel {
  id: string;
  provider: string;
  contextLength: string;
  inputPrice: string;
  outputPrice: string;
}

export const AI_MODELS: AIModel[] = [
  { id: "claude-haiku-4-5", provider: "anthropic", contextLength: "200,000", inputPrice: "$1.00", outputPrice: "$5.00" },
  { id: "deepseek-r1", provider: "byteplus", contextLength: "96,000", inputPrice: "$1.35", outputPrice: "$5.40" },
  { id: "deepseek-v3-2", provider: "byteplus", contextLength: "96,000", inputPrice: "$0.28", outputPrice: "$0.42" },
  { id: "glm-4-7", provider: "byteplus", contextLength: "200,000", inputPrice: "$0.60", outputPrice: "$2.20" },
  { id: "kimi-k2", provider: "byteplus", contextLength: "224,000", inputPrice: "$0.60", outputPrice: "$2.50" },
  { id: "kimi-k2-5-260127", provider: "byteplus", contextLength: "224,000", inputPrice: "$0.60", outputPrice: "$3.00" },
  { id: "kimi-k2-thinking", provider: "byteplus", contextLength: "224,000", inputPrice: "$0.60", outputPrice: "$2.50" },
  { id: "seed-1-8", provider: "byteplus", contextLength: "224,000", inputPrice: "$0.25", outputPrice: "$2.00" },
  { id: "seed-2-0-lite-free", provider: "byteplus", contextLength: "256,000", inputPrice: "Free", outputPrice: "Free" },
  { id: "seed-2-0-mini", provider: "byteplus", contextLength: "256,000", inputPrice: "Free", outputPrice: "Free" },
  { id: "seed-2-0-mini-free", provider: "byteplus", contextLength: "256,000", inputPrice: "Free", outputPrice: "Free" },
  { id: "gemini/gemini-2.0-flash", provider: "google", contextLength: "1,048,576", inputPrice: "$0.10", outputPrice: "$0.40" },
  { id: "gemini/gemini-2.0-flash-lite", provider: "google", contextLength: "1,048,576", inputPrice: "$0.07", outputPrice: "$0.30" },
  { id: "gemini/gemini-2.5-flash", provider: "google", contextLength: "1,048,576", inputPrice: "$0.30", outputPrice: "$2.50" },
  { id: "gemini/gemini-2.5-flash-lite", provider: "google", contextLength: "1,048,576", inputPrice: "$0.10", outputPrice: "$0.40" },
  { id: "gemini/gemini-2.5-pro", provider: "google", contextLength: "1,048,576", inputPrice: "$1.25", outputPrice: "$10.00" },
  { id: "gemini/gemini-3-flash-preview", provider: "google", contextLength: "1,048,576", inputPrice: "$0.50", outputPrice: "$3.00" },
  { id: "gemini/gemini-3-pro-preview", provider: "google", contextLength: "1,048,576", inputPrice: "$2.00", outputPrice: "$12.00" },
  { id: "gpt-4.1", provider: "openai", contextLength: "1,047,576", inputPrice: "$2.00", outputPrice: "$8.00" },
  { id: "gpt-4.1-mini", provider: "openai", contextLength: "1,047,576", inputPrice: "$0.40", outputPrice: "$1.60" },
  { id: "gpt-4.1-nano", provider: "openai", contextLength: "1,047,576", inputPrice: "$0.10", outputPrice: "$0.40" },
  { id: "gpt-4o", provider: "openai", contextLength: "128,000", inputPrice: "$2.50", outputPrice: "$10.00" },
  { id: "gpt-4o-mini", provider: "openai", contextLength: "128,000", inputPrice: "$0.15", outputPrice: "$0.60" },
  { id: "gpt-5", provider: "openai", contextLength: "272,000", inputPrice: "$1.25", outputPrice: "$10.00" },
  { id: "gpt-5-mini", provider: "openai", contextLength: "272,000", inputPrice: "$0.25", outputPrice: "$2.00" },
  { id: "gpt-5-nano", provider: "openai", contextLength: "272,000", inputPrice: "$0.05", outputPrice: "$0.40" },
  { id: "gpt-5.1", provider: "openai", contextLength: "272,000", inputPrice: "$1.25", outputPrice: "$10.00" },
  { id: "gpt-5.1-codex", provider: "openai", contextLength: "272,000", inputPrice: "$1.25", outputPrice: "$10.00" },
  { id: "gpt-5.1-codex-mini", provider: "openai", contextLength: "272,000", inputPrice: "$0.25", outputPrice: "$2.00" },
  { id: "gpt-5.2", provider: "openai", contextLength: "272,000", inputPrice: "$1.75", outputPrice: "$14.00" },
  { id: "gpt-5.2-codex", provider: "openai", contextLength: "272,000", inputPrice: "$1.75", outputPrice: "$14.00" },
  { id: "gpt-image-1", provider: "openai", contextLength: "0", inputPrice: "$10.00", outputPrice: "$40.00" },
  { id: "text-embedding-3-large", provider: "openai", contextLength: "8,191", inputPrice: "$0.13", outputPrice: "Free" },
  { id: "text-embedding-3-small", provider: "openai", contextLength: "8,191", inputPrice: "$0.02", outputPrice: "Free" },
  { id: "whisper-1", provider: "openai", contextLength: "0", inputPrice: "Free", outputPrice: "Free" },
  { id: "glm-5", provider: "z.ai", contextLength: "200,000", inputPrice: "$0.10", outputPrice: "$0.32" },
  { id: "glm-5-code", provider: "z.ai", contextLength: "200,000", inputPrice: "$0.12", outputPrice: "$0.50" },
  { id: "glm-5-turbo", provider: "z.ai", contextLength: "200,000", inputPrice: "$0.12", outputPrice: "$0.40" },
];
