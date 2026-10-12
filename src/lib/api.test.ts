import { afterEach, describe, expect, it, vi } from "vitest";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe("Direct API configuration and media", () => {
  it("requires an explicit backend origin and normalizes trailing slashes", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://backend.example///");
    const { apiBase, normalizeApiBase } = await import("./config");
    expect(apiBase).toBe("https://backend.example");
    expect(() => normalizeApiBase(undefined)).toThrow("VITE_API_BASE_URL");
    expect(() => normalizeApiBase("https://backend.example/api")).toThrow(
      "origin",
    );
    expect(() => normalizeApiBase("https://secret@example.com")).toThrow(
      "credentials",
    );
  });
  it("sends authentication, JSON and multipart directly to the configured backend", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://backend.example/");
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: { ok: true } }), {
          headers: { "content-type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    const { request, setToken, assetUrl } = await import("./api");
    setToken("session");
    await request("/api/admin/support?page=2");
    expect(fetch).toHaveBeenCalledWith(
      "https://backend.example/api/admin/support?page=2",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer session" }),
      }),
    );
    expect(assetUrl("/previews/a.mp3")).toBe(
      "https://backend.example/previews/a.mp3",
    );
    expect(assetUrl("/passage_soundscape_images_webp/a.webp")).toBe(
      "https://backend.example/passage_soundscape_images_webp/a.webp",
    );
    expect(assetUrl("https://cdn.example/a.webp")).toBe(
      "https://cdn.example/a.webp",
    );
    expect(assetUrl("javascript:alert(1)")).toBeUndefined();
    expect(assetUrl("//untrusted.example/image")).toBeUndefined();
  });
  it("fails rather than falling back to the frontend origin", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    await expect(import("./api")).rejects.toThrow("VITE_API_BASE_URL");
  });
});
