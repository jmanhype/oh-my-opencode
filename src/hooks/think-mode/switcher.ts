const HIGH_VARIANT_MAP: Record<string, string> = {
  "claude-sonnet-4-5": "claude-sonnet-4-5-high",
  "claude-opus-4-5": "claude-opus-4-5-high",
  "gemini-3-pro": "gemini-3-pro-high",
  "gemini-3-pro-low": "gemini-3-pro-high",
}

const ALREADY_HIGH: Set<string> = new Set([
  "claude-sonnet-4-5-high",
  "claude-opus-4-5-high",
  "gemini-3-pro-high",
])

// GPT 5+ 모델 패턴: gpt-5, gpt-5.1, gpt-5.2-codex, gpt-6, etc.
const GPT5_PLUS_PATTERN = /^gpt-([5-9]|\d{2,})(\.\d+)?(-\w+)?$/i

function getGptHighVariant(modelID: string): string | null {
  const match = modelID.match(GPT5_PLUS_PATTERN)
  if (!match) return null

  // 이미 -high로 끝나면 null 반환
  if (modelID.endsWith("-high")) return null

  // gpt-5.2-medium -> gpt-5.2-high
  // gpt-5.2-codex -> gpt-5.2-codex-high
  // gpt-5.2 -> gpt-5.2-high
  const suffix = match[3] // -medium, -codex, etc.
  if (suffix && (suffix === "-medium" || suffix === "-low")) {
    // -medium, -low 같은 effort 레벨은 -high로 대체
    return modelID.replace(suffix, "-high")
  }
  // -codex 같은 variant는 유지하고 -high 추가
  return `${modelID}-high`
}

export const THINKING_CONFIGS: Record<string, Record<string, unknown>> = {
  anthropic: {
    thinking: {
      type: "enabled",
      budgetTokens: 64000,
    },
  },
  "amazon-bedrock": {
    reasoningConfig: {
      type: "enabled",
      budgetTokens: 32000,
    },
  },
  google: {
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel: "HIGH",
        },
      },
    },
  },
  "google-vertex": {
    providerOptions: {
      "google-vertex": {
        thinkingConfig: {
          thinkingLevel: "HIGH",
        },
      },
    },
  },
}

const THINKING_CAPABLE_MODELS: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4", "claude-opus-4", "claude-3"],
  "amazon-bedrock": ["claude", "anthropic"],
  google: ["gemini-2", "gemini-3"],
  "google-vertex": ["gemini-2", "gemini-3"],
}

export function getHighVariant(modelID: string): string | null {
  if (isAlreadyHighVariant(modelID)) {
    return null
  }

  // GPT 5+ 모델은 동적으로 처리
  const gptVariant = getGptHighVariant(modelID)
  if (gptVariant) return gptVariant

  return HIGH_VARIANT_MAP[modelID] ?? null
}

export function isAlreadyHighVariant(modelID: string): boolean {
  if (ALREADY_HIGH.has(modelID) || modelID.endsWith("-high")) {
    return true
  }
  // GPT 5+ 모델 중 이미 -high인 경우
  if (GPT5_PLUS_PATTERN.test(modelID) && modelID.endsWith("-high")) {
    return true
  }
  return false
}

export function getThinkingConfig(
  providerID: string,
  modelID: string
): Record<string, unknown> | null {
  if (isAlreadyHighVariant(modelID)) {
    return null
  }

  const config = THINKING_CONFIGS[providerID]
  const capablePatterns = THINKING_CAPABLE_MODELS[providerID]

  if (!config || !capablePatterns) {
    return null
  }

  const modelLower = modelID.toLowerCase()
  const isCapable = capablePatterns.some((pattern) =>
    modelLower.includes(pattern.toLowerCase())
  )

  return isCapable ? config : null
}
