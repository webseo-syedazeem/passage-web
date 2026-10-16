import { describe, expect, it } from "vitest";
import { coverVariantUrl } from "./image-url";
describe("coverVariantUrl", () => {
  it("rewrites an original passage_soundscape_images_webp URL to the requested variant folder", () => {
    expect(
      coverVariantUrl(
        "https://thehappyapp.co.uk/passage_soundscape_images_webp/P-S042-x.webp",
        "sm",
      ),
    ).toBe(
      "https://thehappyapp.co.uk/passage_soundscape_images_webp/sm/P-S042-x.webp",
    );
    expect(
      coverVariantUrl(
        "https://thehappyapp.co.uk/passage_soundscape_images_webp/P-S042-x.webp",
        "md",
      ),
    ).toBe(
      "https://thehappyapp.co.uk/passage_soundscape_images_webp/md/P-S042-x.webp",
    );
  });
  it("passes through undefined and the empty string unchanged", () => {
    expect(coverVariantUrl(undefined, "sm")).toBeUndefined();
    expect(coverVariantUrl("", "sm")).toBe("");
  });
  it("passes through URLs on other hosts / other paths unchanged", () => {
    expect(coverVariantUrl("https://cdn.example.com/avatars/user-123.webp", "sm")).toBe(
      "https://cdn.example.com/avatars/user-123.webp",
    );
    expect(
      coverVariantUrl("https://thehappyapp.co.uk/other_folder/P-S042-x.webp", "sm"),
    ).toBe("https://thehappyapp.co.uk/other_folder/P-S042-x.webp");
  });
  it("does not double-rewrite a URL already inside a variant folder", () => {
    const smUrl = "https://thehappyapp.co.uk/passage_soundscape_images_webp/sm/P-S042-x.webp";
    const lgUrl = "https://thehappyapp.co.uk/passage_soundscape_images_webp/lg/P-S042-x.webp";
    expect(coverVariantUrl(smUrl, "md")).toBe(smUrl);
    expect(coverVariantUrl(lgUrl, "sm")).toBe(lgUrl);
  });
  it("never throws on malformed-looking input", () => {
    expect(() =>
      coverVariantUrl("not a url at all /// passage_soundscape_images_webp/", "sm"),
    ).not.toThrow();
    expect(() => coverVariantUrl("passage_soundscape_images_webp", "sm")).not.toThrow();
  });
});
