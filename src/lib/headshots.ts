/**
 * Maps prospect names to their headshot image imports.
 * Images are in src/assets/images/{kebab-name}.webp
 */

// Eagerly import all headshot images
const imageModules = import.meta.glob<{ default: string }>(
  "../assets/images/*.webp",
  { eager: true }
);

// Build a lookup: kebab filename → resolved URL
const imageByFilename: Record<string, string> = {};
for (const [path, mod] of Object.entries(imageModules)) {
  const filename = path.split("/").pop()?.replace(".webp", "") ?? "";
  imageByFilename[filename] = mod.default;
}

/** Convert a prospect name to the expected kebab-case filename */
function toKebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, "")          // "Jr." → "Jr"
    .replace(/'/g, "")           // O'Brien → OBrien
    .replace(/\s+/g, "-")        // spaces → hyphens
    .replace(/[^a-z0-9-]/g, ""); // strip anything else
}

/**
 * Get the headshot URL for a prospect name.
 * Returns undefined if no image exists.
 */
export function getHeadshot(name: string): string | undefined {
  const key = toKebab(name);
  return imageByFilename[key];
}
