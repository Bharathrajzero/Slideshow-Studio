import { DEFAULT_EFFECT_SETTINGS, effectsFromKeywords } from "@/core/effectsEngine";
import type { EffectSettings } from "@/types";

/**
 * Turns a free-text prompt into concrete FFmpeg effect settings. Today
 * this is keyword heuristics (effectsFromKeywords, no model required).
 * If you later want an LLM to pick these instead of keyword matching,
 * this is the one function to swap — nothing else in the app needs to
 * change.
 */
export function deriveEffectSettings(prompt: string): EffectSettings {
  const overrides = effectsFromKeywords(prompt);
  return { ...DEFAULT_EFFECT_SETTINGS, ...overrides };
}