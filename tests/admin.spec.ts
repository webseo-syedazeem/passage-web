import { test, expect, type Page, type Locator } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type {
  Collection,
  RemoteEntry,
  Soundscape,
  TagEvent,
} from "../src/types/catalogue";
interface Call {
  method: string;
  path: string;
  body: Record<string, unknown>;
}
async function mockApi(page: Page) {
  const calls: Call[] = [];
  const sounds: Soundscape[] = [
    {
      id: "s1",
      title: "Rain at dusk",
      mode: "sleep",
      subcategory: "Rain",
      status: "idea",
      updated_at: "2026-10-06T10:00:00Z",
      contains: ["rain"],
      qa_passed_at: "2026-10-06T10:15:00Z",
      release_date: "2026-10-07",
      short_title: "Dusk",
    },
    {
      id: "s2",
      title: "Quiet piano",
      mode: "focus",
      subcategory: "Piano",
      status: "live",
      updated_at: "2026-10-06T10:00:00Z",
    },
  ];
  const collections: Collection[] = [
    {
      id: "c1",
      title: "Evening rain",
      slug: "evening-rain",
      mode: null,
      explore_group: "nature",
      description: "Rain for rest",
      cover_image_url: null,
      sort_order: 3,
      is_published: false,
      item_count: 1,
      soundscapes: [{ ...sounds[0], collection_sort_order: 7 }],
    },
  ];
  const entries: RemoteEntry[] = [
    {
      key: "home_testimonials",
      value: { quotes: [] },
      is_verified: false,
      updated_at: "2026-10-06T10:00:00Z",
    },
  ];
  const tags: TagEvent[] = [];
  const support = {
    id: "11111111-1111-4111-8111-111111111111",
    type: "report_audio_problem",
    status: "open",
    subject: "Audio issue: Rain at dusk",
    message: "Reported: Audio cuts out.\n\nPlayback pauses after a minute.",
    reason: null,
    contact_email: "listener@example.com",
    user_id: 7,
    user: { id: 7, name: "Test listener", email: "listener@example.com" },
    soundscape_id: "s1",
    soundscape: { id: "s1", title: "Rain at dusk" },
    created_at: "2026-10-06T10:00:00Z",
    updated_at: "2026-10-06T10:00:00Z",
  };
  await page.route(
    "**/passage_soundscape_images_webp/test.webp",
    async (route) =>
      route.fulfill({
        contentType: "image/webp",
        body: await readFile("public/passage-icon.webp"),
      }),
  );
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    expect(url.origin).toBe("http://localhost:3000");
    const path = url.pathname;
    const method = req.method();
    const body = req.headers()["content-type"]?.includes("application/json")
      ? (req.postDataJSON() as Record<string, unknown>)
      : {};
    calls.push({ method, path, body });
    const ok = async (data: unknown) =>
      route.fulfill({ json: { success: true, data } });
    if (path === "/api/signin")
      return ok({ session: { access_token: "test-session" } });
    if (req.headers().authorization !== "Bearer test-session")
      return route.fulfill({
        status: 401,
        json: { success: false, error: "Invalid token" },
      });
    if (path === "/api/admin/upload-image")
      return ok({
        url: "http://localhost:3000/passage_soundscape_images_webp/test.webp",
      });
    if (path === "/api/admin/support")
      return ok({
        requests: [support],
        pagination: { page: 1, page_size: 25, total: 1, total_pages: 1 },
        summary: {
          total: 1,
          open: support.status === "open" ? 1 : 0,
          contact_support: 0,
          request_soundscape: 0,
          report_audio_problem: 1,
        },
      });
    if (path.startsWith("/api/admin/support/")) {
      if (method === "PUT") Object.assign(support, { status: body.status });
      return ok({ request: support });
    }
    if (path === "/api/admin/soundscapes") {
      if (method === "POST") {
        const sound = {
          ...body,
          id: "s3",
          status: "idea",
        } as unknown as Soundscape;
        sounds.push(sound);
        return ok({ soundscape: sound });
      }
      return ok({
        soundscapes: url.searchParams.get("status")
          ? sounds.filter((x) => x.status === url.searchParams.get("status"))
          : sounds,
      });
    }
    const soundMatch = path.match(
      /^\/api\/admin\/soundscapes\/([^/]+)(?:\/(.*))?$/,
    );
    if (soundMatch) {
      const sound = sounds.find((x) => x.id === soundMatch[1])!;
      const action = soundMatch[2];
      if (action === "tag-events") {
        if (method === "POST")
          tags.push({
            ...body,
            id: "t1",
            created_at: "2026-10-06T10:00:00Z",
          } as unknown as TagEvent);
        return ok(
          method === "GET" ? { tag_events: tags } : { tag_event: tags.at(-1) },
        );
      }
      if (action === "status") {
        Object.assign(sound, body);
        return ok({ soundscape: sound });
      }
      if (action === "revise") {
        const revision = { ...sound, id: "revision", status: "idea" as const };
        sounds.push(revision);
        return ok({
          soundscape: revision,
          note: "Original status stays unchanged.",
        });
      }
      if (method === "PUT") Object.assign(sound, body);
      if (method === "DELETE") {
        sounds.splice(sounds.indexOf(sound), 1);
        return ok({ message: "Deleted" });
      }
      return ok({ soundscape: sound });
    }
    if (path === "/api/admin/collections") {
      if (method === "POST") {
        const collection = {
          ...body,
          id: "c2",
          is_published: false,
          item_count: 0,
          soundscapes: [],
        } as unknown as Collection;
        collections.push(collection);
        return ok({ collection });
      }
      return ok({ collections });
    }
    const collectionMatch = path.match(
      /^\/api\/admin\/collections\/([^/]+)(?:\/(.*))?$/,
    );
    if (collectionMatch) {
      const collection = collections.find((x) => x.id === collectionMatch[1])!;
      const action = collectionMatch[2];
      if (action === "publish" || (method === "PUT" && !action))
        Object.assign(collection, body);
      if (action === "soundscapes") {
        collection.soundscapes!.push({
          ...sounds.find((x) => x.id === body.soundscape_id)!,
          collection_sort_order: (body.sort_order as number) ?? 8,
        });
        collection.item_count++;
      }
      if (action?.startsWith("soundscapes/") && method === "DELETE") {
        collection.soundscapes = collection.soundscapes!.filter(
          (x) => x.id !== action.split("/")[1],
        );
        collection.item_count--;
      }
      return ok({ collection });
    }
    if (path === "/api/admin/remote-config") return ok({ entries });
    const remoteMatch = path.match(/^\/api\/admin\/remote-config\/(.+)$/);
    if (remoteMatch) {
      const key = decodeURIComponent(remoteMatch[1]);
      let entry = entries.find((x) => x.key === key);
      if (method === "PUT") {
        if (!entry) {
          entry = {
            key,
            value: null,
            is_verified: false,
            updated_at: "2026-10-06T10:00:00Z",
          };
          entries.push(entry);
        }
        Object.assign(entry, body);
      }
      if (method === "DELETE" && entry)
        entries.splice(entries.indexOf(entry), 1);
      return ok({ entry });
    }
    return route.fulfill({
      status: 404,
      json: { success: false, error: `Unmocked endpoint ${path}` },
    });
  });
  return calls;
}
async function choose(page: Page, control: Locator, label: string | RegExp) {
  await control.click();
  await page.getByRole("option", { name: label, exact: true }).click();
}
async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Soundscapes", exact: true }),
  ).toBeVisible();
}

test("soundscape artwork upload validates files, fills URL, previews WebP and preserves existing URLs", async ({
  page,
}) => {
  const calls = await mockApi(page);
  await signIn(page);
  await page.locator('a[href="/soundscapes/s1"]').first().click();
  await page
    .getByLabel("Artwork URL")
    .fill("https://cdn.example/existing.webp");
  await page
    .getByLabel("Upload artwork", { exact: true })
    .setInputFiles({
      name: "bad.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("invalid"),
    });
  await page.getByRole("button", { name: "Upload selected image" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Supported image formats" }),
  ).toBeVisible();
  await expect(page.getByLabel("Artwork URL")).toHaveValue(
    "https://cdn.example/existing.webp",
  );
  expect(calls.some((call) => call.path.endsWith("/upload-image"))).toBe(false);
  let finishUpload!: () => void;
  const uploadGate = new Promise<void>((resolve) => { finishUpload = resolve; });
  await page.route("**/api/admin/upload-image", async (route) => {
    await uploadGate;
    await route.fallback();
  });
  await page
    .getByLabel("Upload artwork", { exact: true })
    .setInputFiles("public/passage-icon.png");
  await page.getByRole("button", { name: "Upload selected image" }).click();
  await expect(page.getByRole("button", { name: "Uploading…" })).toBeDisabled();
  await expect(page.getByLabel("Artwork URL")).toHaveValue(
    "https://cdn.example/existing.webp",
  );
  finishUpload();
  await expect(page.getByLabel("Artwork URL")).toHaveValue(
    "http://localhost:3000/passage_soundscape_images_webp/test.webp",
  );
  const image = page.getByRole("img", { name: "Upload artwork preview" });
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Soundscapes", exact: true }),
  ).toBeVisible();
  expect(
    calls.find(
      (call) =>
        call.method === "PUT" && call.path === "/api/admin/soundscapes/s1",
    )?.body.artwork_url,
  ).toBe("http://localhost:3000/passage_soundscape_images_webp/test.webp");
});

test("support list filters, detail, existing status changes, loading, empty and error states", async ({
  page,
}) => {
  const calls = await mockApi(page);
  await signIn(page);
  await page.route("**/api/admin/support?*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.fallback();
  });
  await page
    .getByRole("link", { name: "Support & Requests", exact: true })
    .click();
  await expect(page.getByLabel("Loading", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Test listener listener@example.com" }),
  ).toBeVisible();
  const filtered = page.waitForRequest((request) =>
    request.url().includes("/api/admin/support?type=report_audio_problem"),
  );
  await choose(page, page.getByLabel("Type", { exact: true }), "Audio report");
  await filtered;
  await page.getByLabel("Search submissions").fill("Playback");
  const searched = page.waitForRequest((request) =>
    request.url().includes("q=Playback"),
  );
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await searched;
  await page.getByRole("link", { name: "View request" }).click();
  await expect(
    page.getByText("Playback pauses after a minute.", { exact: false }),
  ).toBeVisible();
  await choose(page, page.getByLabel("Status", { exact: true }), "Resolved");
  await page.getByRole("button", { name: "Save status" }).click();
  await expect(
    page.getByRole("button", { name: "Save status" }),
  ).toBeDisabled();
  expect(
    calls.find(
      (call) =>
        call.method === "PUT" &&
        call.path.endsWith(
          "/support/11111111-1111-4111-8111-111111111111/status",
        ),
    )?.body,
  ).toEqual({ status: "resolved" });
  await page.route("**/api/admin/support?*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({
      status: 500,
      json: { success: false, error: "Support temporarily unavailable" },
    });
  });
  await page.getByRole("link", { name: "Back to support" }).click();
  await expect(page.getByText("Unable to load this view")).toBeVisible();
  await page.route("**/api/admin/support?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          requests: [],
          pagination: { page: 1, page_size: 25, total: 0, total_pages: 0 },
          summary: {
            total: 0,
            open: 0,
            contact_support: 0,
            request_soundscape: 0,
            report_audio_problem: 0,
          },
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByText("No submissions match these filters.", { exact: false }),
  ).toBeVisible();
});

test("major page visual review and responsive layouts", async ({ page }) => {
  await mockApi(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.screenshot({
    path: "test-results/visual-login.png",
    fullPage: true,
  });
  await signIn(page);
  await page.screenshot({
    path: "test-results/visual-soundscapes.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Add soundscape" }).click();
  await expect(page.getByLabel('Release date')).toBeVisible();
  await page.screenshot({
    path: "test-results/visual-soundscape-form.png",
    fullPage: true,
  });
  await expect(page.locator('select:not([aria-hidden="true"])')).toHaveCount(0);
  await page.getByRole("link", { name: "Collections", exact: true }).click();
  await expect(page.getByRole("link", { name: "Members" })).toBeVisible();
  await page.screenshot({
    path: "test-results/visual-collections.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Members" }).click();
  await expect(
    page.getByRole("heading", { name: "Add a soundscape" }),
  ).toBeVisible();
  await page.getByLabel("Soundscape", { exact: true }).click();
  await page.screenshot({
    path: "test-results/visual-members-picker.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "Edit metadata" }).click();
  await page.screenshot({
    path: "test-results/visual-collection-form.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Remote config", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Edit", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/visual-remote-config.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Support & Requests", exact: true })
    .click();
  await expect(page.getByRole("link", { name: "View request" })).toBeVisible();
  await page.screenshot({
    path: "test-results/visual-support.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "View request" }).click();
  await expect(
    page.getByRole("heading", { name: "Message", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/visual-support-detail.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const label of [
    "Soundscapes",
    "Collections",
    "Remote config",
    "Support & Requests",
  ]) {
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByRole("dialog")
      .getByRole("link", { name: label, exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: label, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/visual-mobile-${label.split(" ")[0].toLowerCase()}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
test("every admin route remains usable without page overflow across the required viewport matrix", async ({ page }) => {
  test.setTimeout(150_000);
  await mockApi(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const viewports = [
    [1920, 1080], [1440, 900], [1366, 768], [1280, 800], [1024, 768],
    [768, 1024], [430, 932], [390, 844], [375, 812], [360, 800], [844, 390],
  ] as const;
  const routes = [
    ["/soundscapes", "Soundscapes"],
    ["/soundscapes/new", "Add soundscape"],
    ["/soundscapes/s1", "Rain at dusk"],
    ["/collections", "Collections"],
    ["/collections/new", "Add collection"],
    ["/collections/c1", "Evening rain"],
    ["/collections/c1/edit", "Edit Evening rain"],
    ["/remote-config", "Remote config"],
    ["/remote-config/new", "Add remote config entry"],
    ["/remote-config/home_testimonials/edit", "Edit home_testimonials"],
    ["/support", "Support & Requests"],
    ["/support/11111111-1111-4111-8111-111111111111", "Audio issue: Rain at dusk"],
    ["/missing", "Page not found"],
  ] as const;

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth)).toBe(true);
    await signIn(page);
    for (const [path, heading] of routes) {
      await page.evaluate((nextPath) => {
        window.history.pushState({}, "", nextPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }, path);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.body.scrollWidth <= window.innerWidth), `${path} overflowed at ${width}x${height}`).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
test("soundscape search, server status filter, revision confirmation, status and idea-only delete", async ({
  page,
}) => {
  const calls = await mockApi(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await signIn(page);
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: "Quiet piano" })
      .getByRole("button", { name: "Delete", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Search soundscapes").fill("Rain");
  await expect(page.getByText("Quiet piano", { exact: true })).toHaveCount(0);
  await page.getByLabel("Search soundscapes").fill("");
  await choose(page, page.getByLabel("Status filter", { exact: true }), "idea");
  await expect(page.getByText("Quiet piano", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Revise", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  expect(calls.some((x) => x.path.endsWith("/revise"))).toBe(false);
  await page.getByRole("button", { name: "Revise", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Revise", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  const row = page
    .getByRole("row")
    .filter({ has: page.locator('a[href="/soundscapes/s1"]') });
  await choose(page, row.getByLabel("New status for Rain at dusk"), "on hold");
  await row.getByRole("button", { name: "Update status" }).click();
  await expect(row).toHaveCount(0);
  expect(
    calls.find((x) => x.path === "/api/admin/soundscapes/s1/status")?.body,
  ).toEqual({ status: "on_hold" });
  const revision = page
    .getByRole("row")
    .filter({ has: page.locator('a[href="/soundscapes/revision"]') });
  await revision.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(revision).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("soundscape status is optimistic, prevents duplicates and rolls back on failure", async ({ page }) => {
  const calls = await mockApi(page);
  await signIn(page);
  const row = page.getByRole("row").filter({ has: page.locator('a[href="/soundscapes/s1"]') });

  let finishSuccess!: () => void;
  const successGate = new Promise<void>((resolve) => { finishSuccess = resolve; });
  await page.route("**/api/admin/soundscapes/s1/status", async (route) => {
    await successGate;
    await route.fallback();
  });
  await choose(page, row.getByLabel("New status for Rain at dusk"), "on hold");
  await row.getByRole("button", { name: "Update status" }).click();
  await expect(row.locator('[data-slot="badge"]')).toHaveText("on hold");
  await expect(row.getByRole("button", { name: "Working…" })).toBeDisabled();
  expect(calls.filter((call) => call.path.endsWith("/s1/status"))).toHaveLength(0);
  finishSuccess();
  await expect.poll(() => calls.filter((call) => call.path.endsWith("/s1/status")).length).toBe(1);
  await page.unroute("**/api/admin/soundscapes/s1/status");

  let finishFailure!: () => void;
  const failureGate = new Promise<void>((resolve) => { finishFailure = resolve; });
  await page.route("**/api/admin/soundscapes/s1/status", async (route) => {
    await failureGate;
    await route.fulfill({ status: 500, json: { success: false, error: "Status service unavailable" } });
  });
  await choose(page, row.getByLabel("New status for Rain at dusk"), "live");
  await row.getByRole("button", { name: "Update status" }).click();
  await expect(row.locator('[data-slot="badge"]')).toHaveText("live");
  finishFailure();
  await expect(row.locator('[data-slot="badge"]')).toHaveText("on hold");
  await expect(page.getByText("Previous status restored.", { exact: false })).toBeVisible();
});
test("full soundscape create/edit and tag governance payloads", async ({
  page,
}) => {
  const calls = await mockApi(page);
  await signIn(page);
  await page.getByRole("link", { name: "Add soundscape" }).click();
  await choose(page, page.locator("#field-mode"), "relax");
  await page.getByLabel("Subcategory", { exact: false }).fill("Forest");
  await page.locator("#field-title").fill("Forest at dawn");
  await page.locator("#field-contains").fill("birds, birds, wind");
  await page.getByLabel("Intensity").fill("3");
  await page.getByLabel("Sort score").fill("5");
  await page.getByLabel("Audio loops").check();
  await page
    .getByRole("button", { name: "Create idea-stage soundscape" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Soundscapes", exact: true }),
  ).toBeVisible();
  expect(
    calls.find(
      (x) => x.method === "POST" && x.path === "/api/admin/soundscapes",
    )?.body,
  ).toMatchObject({
    mode: "relax",
    title: "Forest at dawn",
    contains: ["birds", "wind"],
    intensity: 3,
    sort_score: 5,
    is_loop: true,
  });
  await page.locator('a[href="/soundscapes/s1"]').first().click();
  await expect(page.getByLabel("Short title")).toHaveValue("Dusk");
  await page.getByLabel("Tag value").fill("rain");
  await choose(page, page.getByLabel("State", { exact: false }), "verified");
  await page.getByLabel("Source", { exact: true }).fill("QA reviewer");
  await page.getByRole("button", { name: "Log tag event" }).click();
  await expect(
    page.getByRole("cell", { name: "QA reviewer", exact: true }),
  ).toBeVisible();
  expect(
    calls.find((x) => x.method === "POST" && x.path.endsWith("/tag-events"))
      ?.body,
  ).toEqual({
    tag_group: "contains",
    tag_value: "rain",
    state: "verified",
    source: "QA reviewer",
  });
  await page.getByLabel("Short title").fill("");
  await expect(page.getByLabel("Release date")).toHaveText("7 Oct 2026");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Soundscapes", exact: true }),
  ).toBeVisible();
  expect(
    calls.find(
      (x) => x.method === "PUT" && x.path === "/api/admin/soundscapes/s1",
    )?.body,
  ).toMatchObject({
    short_title: null,
    contains: ["rain"],
    human_presence: false,
    is_loop: false,
  });
});
test("shared date picker preselects and submits date-only values without timezone drift", async ({ page }) => {
  const calls = await mockApi(page);
  await signIn(page);
  await page.locator('a[href="/soundscapes/s1"]').first().click();
  const releaseDate = page.getByLabel("Release date");
  await expect(releaseDate).toHaveText("7 Oct 2026");
  await releaseDate.click();
  await expect(page.locator('[data-slot="popover-content"] [data-day="2026-10-07"]')).toHaveAttribute("aria-selected", "true");
  await page.locator('[data-slot="popover-content"] [data-day="2026-10-08"]').click();
  await expect(releaseDate).toHaveText("8 Oct 2026");
  await page.getByRole("button", { name: "Save changes" }).click();
  expect(calls.find((call) => call.method === "PUT" && call.path === "/api/admin/soundscapes/s1")?.body.release_date).toBe("2026-10-08");
});
test("collections preserve actual membership order, all-status options, assignment, removal and publication", async ({
  page,
}) => {
  const calls = await mockApi(page);
  await signIn(page);
  await page.getByRole("link", { name: "Collections", exact: true }).click();
  await page.getByRole("link", { name: "Members", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "7", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Soundscape", { exact: true }).click();
  await expect(page.getByRole("option", { name: /Rain at dusk/ })).toHaveCount(
    0,
  );
  const pickerSearch = page.getByRole('combobox', {name: 'Search available soundscapes'});
  await expect(pickerSearch).toHaveAttribute("autocomplete", /^(off|new-password)$/);
  await expect(pickerSearch).toHaveAttribute("data-lpignore", "true");
  await expect(pickerSearch).toHaveAttribute("data-1p-ignore", "true");
  await pickerSearch.fill("unrelated saved address");
  await page.keyboard.press("Escape");
  await page.getByLabel("Soundscape", { exact: true }).click();
  await expect(pickerSearch).toHaveValue("");
  await pickerSearch.fill("piano");
  await pickerSearch.press("ArrowDown");
  await pickerSearch.press("Enter");
  await expect(page.getByLabel("Soundscape", { exact: true })).toContainText("Quiet piano");
  await page.getByLabel("Sort order (optional)").fill("12");
  let finishAdd!: () => void;
  const addGate = new Promise<void>((resolve) => { finishAdd = resolve; });
  await page.route("**/api/admin/collections/c1/soundscapes", async (route) => {
    await addGate;
    await route.fallback();
  });
  await page
    .getByRole("button", { name: "Add soundscape", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "12", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Adding…" })).toBeDisabled();
  finishAdd();
  await expect.poll(() => calls.filter((call) => call.method === "POST" && call.path === "/api/admin/collections/c1/soundscapes").length).toBe(1);
  await page.unroute("**/api/admin/collections/c1/soundscapes");
  expect(
    calls.find(
      (x) =>
        x.method === "POST" &&
        x.path === "/api/admin/collections/c1/soundscapes",
    )?.body,
  ).toEqual({ soundscape_id: "s2", sort_order: 12 });
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unpublish", exact: true }),
  ).toBeVisible();
  let finishRemoveFailure!: () => void;
  const removeFailureGate = new Promise<void>((resolve) => { finishRemoveFailure = resolve; });
  await page.route("**/api/admin/collections/c1/soundscapes/s2", async (route) => {
    await removeFailureGate;
    await route.fulfill({ status: 500, json: { success: false, error: "Membership service unavailable" } });
  });
  await page
    .getByRole("row")
    .filter({ hasText: "Quiet piano" })
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "Quiet piano", exact: true }),
  ).toHaveCount(0);
  finishRemoveFailure();
  await expect(page.getByRole("cell", { name: "Quiet piano", exact: true })).toBeVisible();
  await expect(page.getByText("Previous collection restored.", { exact: false })).toBeVisible();
  await page.unroute("**/api/admin/collections/c1/soundscapes/s2");
  await page
    .getByRole("row")
    .filter({ hasText: "Quiet piano" })
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await expect(page.getByRole("cell", { name: "Quiet piano", exact: true })).toHaveCount(0);
  expect(
    calls.some(
      (x) =>
        x.method === "DELETE" &&
        x.path === "/api/admin/collections/c1/soundscapes/s2",
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Publish", exact: true }),
  ).toBeVisible();
});
test("collection metadata create/edit, cover upload and image fallback", async ({
  page,
}) => {
  const calls = await mockApi(page);
  await signIn(page);
  await page.getByRole("link", { name: "Collections", exact: true }).click();
  await page.getByRole("link", { name: "Add collection" }).click();
  await page.getByLabel("Slug").fill("new-collection");
  await page.locator("#field-title").fill("New collection");
  await choose(page, page.locator("#field-mode"), "No mode");
  await choose(
    page,
    page.getByLabel("Explore group", { exact: false }),
    "weather",
  );
  await page.getByLabel("Description").fill("Clouds and rain");
  await page.getByLabel("Sort order", { exact: true }).fill("4");
  await page.getByLabel("Upload cover image").setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: Buffer.from("test"),
  });
  await page.getByRole("button", { name: "Upload selected image" }).click();
  await expect(page.getByLabel("Cover image URL")).toHaveValue(
    "http://localhost:3000/passage_soundscape_images_webp/test.webp",
  );
  await expect(page.getByRole('img', {name:'Upload cover image preview'})).toBeVisible();
  await page
    .getByRole("button", { name: "Create unpublished collection" })
    .click();
  await expect(
    page.getByRole("heading", { name: "New collection", exact: true }),
  ).toBeVisible();
  expect(
    calls.find(
      (x) => x.method === "POST" && x.path === "/api/admin/collections",
    )?.body,
  ).toMatchObject({
    slug: "new-collection",
    title: "New collection",
    explore_group: "weather",
    sort_order: 4,
    description: "Clouds and rain",
  });
  await page.getByRole("link", { name: "Edit metadata" }).click();
  await choose(page, page.locator("#field-mode"), "sleep");
  await page.getByLabel("Description").fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "New collection", exact: true }),
  ).toBeVisible();
  expect(
    calls.find(
      (x) => x.method === "PUT" && x.path === "/api/admin/collections/c2",
    )?.body,
  ).toMatchObject({ mode: "sleep", description: null });
});
test("remote config JSON validation, readonly key, verified upsert and confirmed delete", async ({
  page,
}) => {
  const calls = await mockApi(page);
  await signIn(page);
  await page.getByRole("link", { name: "Remote config", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Remote config", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Key", { exact: false })).toHaveAttribute(
    "readonly",
    "",
  );
  await page.getByLabel("Value (JSON)", { exact: false }).fill("{broken}");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByText("Value must be valid JSON", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Value (JSON)", { exact: false }).fill("null");
  await page.getByLabel("Verified (public)").check();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Remote config", exact: true }),
  ).toBeVisible();
  expect(
    calls.find(
      (x) => x.method === "PUT" && x.path.endsWith("/home_testimonials"),
    )?.body,
  ).toEqual({ value: null, is_verified: true });
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByText("No remote config entries found.")).toBeVisible();
  await page.getByRole("link", { name: "Add entry" }).click();
  await page.getByLabel("Key", { exact: false }).fill("banner");
  await page
    .getByLabel("Value (JSON)", { exact: false })
    .fill('["hello", false]');
  await page.getByRole("button", { name: "Create entry", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Remote config", exact: true }),
  ).toBeVisible();
  expect(
    calls.find((x) => x.method === "PUT" && x.path.endsWith("/banner"))?.body,
  ).toEqual({ value: ["hello", false], is_verified: false });
});
test("mobile drawer, form layout, logout and memory-only reload", async ({
  page,
}) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await expect(
    page.getByRole("button", { name: "Open navigation" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Collections", exact: true })
    .click();
  await page.getByRole("link", { name: "Add collection" }).click();
  await expect(page.getByLabel("Slug")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-collection.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await signIn(page);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});
test("non-admin verification errors keep account signed out", async ({
  page,
}) => {
  await mockApi(page);
  await page.route("**/api/admin/soundscapes", (route) =>
    route.fulfill({
      status: 403,
      json: { success: false, error: "Admin access required" },
    }),
  );
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill("member@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "This account does not have admin access.",
  );
});
test("network errors offer retry, empty state renders and expired sessions return to sign-in", async ({
  page,
}) => {
  await mockApi(page);
  await signIn(page);
  await page.route("**/api/admin/collections", (route) =>
    route.fulfill({
      status: 500,
      json: { success: false, error: "Failed to get collections" },
    }),
  );
  await page.getByRole("link", { name: "Collections", exact: true }).click();
  await expect(page.getByText("Unable to load this view")).toBeVisible();
  await page.route("**/api/admin/collections", (route) =>
    route.fulfill({ json: { success: true, data: { collections: [] } } }),
  );
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByText(
      "No collections found. Create a collection to start curating.",
    ),
  ).toBeVisible();
  await page.route("**/api/admin/remote-config", (route) =>
    route.fulfill({
      status: 401,
      json: { success: false, error: "Invalid or expired access token" },
    }),
  );
  await page.getByRole("link", { name: "Remote config", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
});
