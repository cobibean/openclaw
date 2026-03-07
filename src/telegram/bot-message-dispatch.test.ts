import type { Bot } from "grammy";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createTelegramDraftStream = vi.hoisted(() => vi.fn());
const dispatchReplyWithBufferedBlockDispatcher = vi.hoisted(() => vi.fn());
const deliverReplies = vi.hoisted(() => vi.fn());

vi.mock("./draft-stream.js", () => ({
  createTelegramDraftStream,
}));

vi.mock("../auto-reply/reply/provider-dispatcher.js", () => ({
  dispatchReplyWithBufferedBlockDispatcher,
}));

vi.mock("./bot/delivery.js", () => ({
  deliverReplies,
}));

vi.mock("./sticker-cache.js", () => ({
  cacheSticker: vi.fn(),
  describeStickerImage: vi.fn(),
}));

import { dispatchTelegramMessage } from "./bot-message-dispatch.js";

function createRuntime() {
  return {
    log: vi.fn(),
    error: vi.fn(),
    exit: () => {
      throw new Error("exit");
    },
  };
}

function createTelegramContext(overrides: Record<string, unknown> = {}) {
  return {
    ctxPayload: {},
    primaryCtx: { message: { chat: { id: 123, type: "private" } } },
    msg: {
      chat: { id: 123, type: "private" },
      message_id: 456,
      message_thread_id: 777,
    },
    chatId: 123,
    isGroup: false,
    resolvedThreadId: undefined,
    replyThreadId: 777,
    threadSpec: { id: 777, scope: "dm" },
    historyKey: undefined,
    historyLimit: 0,
    groupHistories: new Map(),
    route: { agentId: "default", accountId: "default" },
    skillFilter: undefined,
    sendTyping: vi.fn(),
    sendRecordVoice: vi.fn(),
    ackReactionPromise: null,
    reactionApi: null,
    removeAckAfterReply: false,
    ...overrides,
  };
}

describe("dispatchTelegramMessage draft streaming", () => {
  beforeEach(() => {
    createTelegramDraftStream.mockReset();
    dispatchReplyWithBufferedBlockDispatcher.mockReset();
    deliverReplies.mockReset();
  });

  it("streams drafts in private threads and forwards thread id", async () => {
    const draftStream = {
      update: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
    };
    createTelegramDraftStream.mockReturnValue(draftStream);
    dispatchReplyWithBufferedBlockDispatcher.mockImplementation(
      async ({ dispatcherOptions, replyOptions }) => {
        await replyOptions?.onPartialReply?.({ text: "Hello" });
        await dispatcherOptions.deliver({ text: "Hello" }, { kind: "final" });
        return { queuedFinal: true };
      },
    );
    deliverReplies.mockResolvedValue({ delivered: true });

    const resolveBotTopicsEnabled = vi.fn().mockResolvedValue(true);
    const context = createTelegramContext();

    const bot = { api: { sendMessageDraft: vi.fn() } } as unknown as Bot;
    const runtime = createRuntime();

    await dispatchTelegramMessage({
      context,
      bot,
      cfg: {},
      runtime,
      replyToMode: "first",
      streamMode: "partial",
      textLimit: 4096,
      telegramCfg: {},
      opts: { token: "token" },
      resolveBotTopicsEnabled,
    });

    expect(resolveBotTopicsEnabled).toHaveBeenCalledWith(context.primaryCtx);
    expect(createTelegramDraftStream).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: 123,
        thread: { id: 777, scope: "dm" },
      }),
    );
    expect(draftStream.update).toHaveBeenCalledWith("Hello");
    expect(deliverReplies).toHaveBeenCalledWith(
      expect.objectContaining({
        thread: { id: 777, scope: "dm" },
      }),
    );
  });

  it("warns when draft streaming is unavailable and block streaming is not enabled", async () => {
    dispatchReplyWithBufferedBlockDispatcher.mockImplementation(async ({ dispatcherOptions }) => {
      await dispatcherOptions.deliver({ text: "Hello" }, { kind: "final" });
      return { queuedFinal: true };
    });
    deliverReplies.mockResolvedValue({ delivered: true });

    const resolveBotTopicsEnabled = vi.fn().mockResolvedValue(true);
    const context = createTelegramContext({
      primaryCtx: { message: { chat: { id: -1001, type: "group" } } },
      msg: {
        chat: { id: -1001, type: "group" },
        message_id: 456,
        message_thread_id: 777,
      },
      chatId: -1001,
      isGroup: true,
      threadSpec: { id: 777, scope: "forum" },
    });
    const bot = { api: { sendMessageDraft: vi.fn() } } as unknown as Bot;
    const runtime = createRuntime();

    await dispatchTelegramMessage({
      context,
      bot,
      cfg: {},
      runtime,
      replyToMode: "first",
      streamMode: "partial",
      textLimit: 4096,
      telegramCfg: {},
      opts: { token: "token" },
      resolveBotTopicsEnabled,
    });

    expect(runtime.error).toHaveBeenCalledWith(
      expect.stringContaining("telegram draft streaming unavailable (not_private_chat)"),
    );
  });

  it("does not warn when block streaming is enabled", async () => {
    dispatchReplyWithBufferedBlockDispatcher.mockImplementation(async ({ dispatcherOptions }) => {
      await dispatcherOptions.deliver({ text: "Hello" }, { kind: "final" });
      return { queuedFinal: true };
    });
    deliverReplies.mockResolvedValue({ delivered: true });

    const resolveBotTopicsEnabled = vi.fn().mockResolvedValue(true);
    const context = createTelegramContext({
      primaryCtx: { message: { chat: { id: -1001, type: "group" } } },
      msg: {
        chat: { id: -1001, type: "group" },
        message_id: 456,
        message_thread_id: 777,
      },
      chatId: -1001,
      isGroup: true,
      threadSpec: { id: 777, scope: "forum" },
    });
    const bot = { api: { sendMessageDraft: vi.fn() } } as unknown as Bot;
    const runtime = createRuntime();

    await dispatchTelegramMessage({
      context,
      bot,
      cfg: {},
      runtime,
      replyToMode: "first",
      streamMode: "partial",
      textLimit: 4096,
      telegramCfg: { blockStreaming: true },
      opts: { token: "token" },
      resolveBotTopicsEnabled,
    });

    expect(runtime.error).not.toHaveBeenCalled();
  });

  it("dedupes draft-unavailable warnings by reason", async () => {
    dispatchReplyWithBufferedBlockDispatcher.mockImplementation(async ({ dispatcherOptions }) => {
      await dispatcherOptions.deliver({ text: "Hello" }, { kind: "final" });
      return { queuedFinal: true };
    });
    deliverReplies.mockResolvedValue({ delivered: true });

    const resolveBotTopicsEnabled = vi.fn().mockResolvedValue(true);
    const context = createTelegramContext({
      primaryCtx: { message: { chat: { id: -1001, type: "group" } } },
      msg: {
        chat: { id: -1001, type: "group" },
        message_id: 456,
        message_thread_id: 777,
      },
      chatId: -1001,
      isGroup: true,
      threadSpec: { id: 777, scope: "forum" },
    });
    const bot = { api: { sendMessageDraft: vi.fn() } } as unknown as Bot;
    const runtime = createRuntime();

    await dispatchTelegramMessage({
      context,
      bot,
      cfg: {},
      runtime,
      replyToMode: "first",
      streamMode: "partial",
      textLimit: 4096,
      telegramCfg: {},
      opts: { token: "token" },
      resolveBotTopicsEnabled,
    });
    await dispatchTelegramMessage({
      context,
      bot,
      cfg: {},
      runtime,
      replyToMode: "first",
      streamMode: "partial",
      textLimit: 4096,
      telegramCfg: {},
      opts: { token: "token" },
      resolveBotTopicsEnabled,
    });

    expect(runtime.error).toHaveBeenCalledTimes(1);
  });
});
