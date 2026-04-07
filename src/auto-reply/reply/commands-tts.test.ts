import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OpenClawConfig } from "../../config/config.js";
import type { MsgContext } from "../templating.js";
import { buildCommandContext, handleCommands } from "./commands.js";
import { parseInlineDirectives } from "./directive-handling.js";
import { textToSpeech } from "../../tts/tts.js";

vi.mock("../../tts/tts.js", () => ({
  getLastTtsAttempt: vi.fn(() => null),
  getTtsMaxLength: vi.fn(() => 4000),
  getTtsProvider: vi.fn(() => "elevenlabs"),
  isSummarizationEnabled: vi.fn(() => true),
  isTtsEnabled: vi.fn(() => false),
  isTtsProviderConfigured: vi.fn(() => true),
  resolveTtsApiKey: vi.fn(() => "key"),
  resolveTtsConfig: vi.fn((cfg) => cfg.messages?.tts ?? {}),
  resolveTtsPrefsPath: vi.fn(() => "/tmp/tts.json"),
  setLastTtsAttempt: vi.fn(),
  setSummarizationEnabled: vi.fn(),
  setTtsEnabled: vi.fn(),
  setTtsMaxLength: vi.fn(),
  setTtsProvider: vi.fn(),
  textToSpeech: vi.fn(),
}));

function buildParams(commandBody: string, channel: "telegram" | "whatsapp") {
  const cfg = {
    commands: { text: true },
    channels: {
      [channel]: { allowFrom: ["*"] },
    },
    messages: {
      tts: {
        provider: "elevenlabs",
      },
    },
  } as OpenClawConfig;

  const ctx = {
    Body: commandBody,
    CommandBody: commandBody,
    CommandSource: "text",
    CommandAuthorized: true,
    Provider: channel,
    Surface: channel,
  } as MsgContext;

  const command = buildCommandContext({
    ctx,
    cfg,
    isGroup: false,
    triggerBodyNormalized: commandBody.trim().toLowerCase(),
    commandAuthorized: true,
  });

  return {
    ctx,
    cfg,
    command,
    directives: parseInlineDirectives(commandBody),
    elevated: { enabled: true, allowed: true, failures: [] },
    sessionKey: `agent:main:${channel}`,
    workspaceDir: "/tmp",
    defaultGroupActivation: () => "mention",
    resolvedVerboseLevel: "off" as const,
    resolvedReasoningLevel: "off" as const,
    resolveDefaultThinkingLevel: async () => undefined,
    provider: channel,
    model: "test-model",
    contextTokens: 0,
    isGroup: false,
  };
}

describe("/tts audio command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(textToSpeech).mockResolvedValue({
      success: true,
      provider: "elevenlabs",
      attemptedProviders: ["elevenlabs"],
      attempts: 1,
      audioPath: "/tmp/test.opus",
      voiceCompatible: true,
      latencyMs: 123,
    });
  });

  it("sends Telegram /tts audio replies as regular audio files", async () => {
    const result = await handleCommands(buildParams("/tts audio hello world", "telegram"));
    expect(result.shouldContinue).toBe(false);
    expect(result.reply).toMatchObject({
      mediaUrl: "/tmp/test.opus",
      audioAsVoice: false,
    });
  });

  it("keeps voice-compatible audio as voice on non-Telegram channels", async () => {
    const result = await handleCommands(buildParams("/tts audio hello world", "whatsapp"));
    expect(result.shouldContinue).toBe(false);
    expect(result.reply).toMatchObject({
      mediaUrl: "/tmp/test.opus",
      audioAsVoice: true,
    });
  });
});
