/**
 * Shared AI provider utility.
 *
 * Supports OpenAI, Google Gemini, and Groq — all via the OpenAI SDK
 * (Gemini and Groq both expose OpenAI-compatible chat completion endpoints).
 */

import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Provider configuration map
// ---------------------------------------------------------------------------

export type AIProvider = "openai" | "gemini" | "groq";

export interface ProviderConfig {
  /** Default base URL for the provider's OpenAI-compatible endpoint. */
  baseURL: string;
  /** Friendly display name shown in the UI. */
  label: string;
  /** Default model if none is configured in the channel's ai_settings row. */
  defaultModel: string;
  /** Models available for selection in the UI. */
  models: string[];
}

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  openai: {
    baseURL: "https://api.openai.com/v1",
    label: "OpenAI",
    defaultModel: "gpt-4o-mini",
    models: [
      "gpt-4.1",
      "gpt-4.1-mini",
      "gpt-4.1-nano",
      "gpt-4o",
      "gpt-4o-mini",
      "o3-mini",
      "o1",
      "o1-mini",
      "gpt-4-turbo",
      "gpt-4",
      "gpt-3.5-turbo",
    ],
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    label: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    models: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ],
  },
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
      "deepseek-r1-distill-llama-70b",
    ],
  },
};

/**
 * All supported provider keys — handy for iteration / validation.
 */
export const SUPPORTED_PROVIDERS: AIProvider[] = ["openai", "gemini", "groq"];

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

/**
 * Create an OpenAI-compatible client for the given provider.
 *
 * Both Gemini and Groq expose OpenAI-compatible REST endpoints, so we can use
 * the same `openai` SDK for all three providers — only the `baseURL` and
 * `apiKey` differ.
 */
export function createAIClient(
  provider: AIProvider | string,
  apiKey: string,
  endpoint?: string
): OpenAI {
  const cfg = PROVIDER_CONFIGS[provider as AIProvider];
  return new OpenAI({
    apiKey,
    baseURL: endpoint || cfg?.baseURL || "https://api.openai.com/v1",
  });
}

/**
 * Return the default endpoint URL for a given provider.
 */
export function getDefaultEndpoint(provider: AIProvider | string): string {
  return PROVIDER_CONFIGS[provider as AIProvider]?.baseURL || "https://api.openai.com/v1";
}

/**
 * Return the default model for a given provider.
 */
export function getDefaultModel(provider: AIProvider | string): string {
  return PROVIDER_CONFIGS[provider as AIProvider]?.defaultModel || "gpt-4o-mini";
}

/**
 * Return the available models for a given provider.
 */
export function getProviderModels(provider: AIProvider | string): string[] {
  return PROVIDER_CONFIGS[provider as AIProvider]?.models || [];
}
