import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";

const externalRoot = process.env.NK_EXTERNAL_OUTPUT_ROOT;
const mirrorRoot = path.join(process.cwd(), "data", "source");
const publicRoot = path.join(process.cwd(), "public", "thumbnails");
const write = process.argv.includes("--write");

if (!externalRoot) {
  throw new Error("NK_EXTERNAL_OUTPUT_ROOT is required for sync-content.");
}

const fileCopies = [
  "genresList.json",
  "hanimeIndex.json",
  "hanimeLists.json",
  "javLists.json",
  "javCosplayLists.json",
  "2dAnimationLists.json",
  "3dHentaiLists.json",
];

const detailDirs = [
  "details/hanime",
  "details/jav",
  "details/jav-cosplay",
  "details/2d-animation",
  "details/3d-hentai",
];

const thumbnailDirs = [
  { source: "details/hanime/thumbnails", target: "hanime" },
  { source: "details/jav/thumbnails", target: "jav" },
  { source: "details/jav-cosplay/thumbnails", target: "jav-cosplay" },
  { source: "details/2d-animation/thumbnails", target: "2d-animation" },
  { source: "details/3d-hentai/thumbnails", target: "3d-hentai" },
  { source: "details/hanime-cover-upscaled", target: "hanime-cover" },
];

const listThumbnailTargets = {
  "hanimeLists.json": "hanime",
  "javLists.json": "jav",
  "javCosplayLists.json": "jav-cosplay",
  "2dAnimationLists.json": "2d-animation",
  "3dHentaiLists.json": "3d-hentai",
};

function normalizeBase(fileName) {
  return fileName.replace(/\.[^.]+$/, "").toLowerCase();
}

async function ensureDir(dirPath) {
  if (write) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function copyFileIfNeeded(source, target) {
  if (!write) {
    return;
  }

  await ensureDir(path.dirname(target));
  await fs.copyFile(source, target);
}

async function copyDirFiltered(sourceDir, targetDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirFiltered(source, target);
      continue;
    }

    if (!entry.name.endsWith(".json")) {
      continue;
    }

    if (entry.name.includes("progress") || entry.name.includes("archive")) {
      continue;
    }

    await copyFileIfNeeded(source, target);
  }
}

async function buildAssetMap(dirPath, publicPrefix) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const map = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    map.set(normalizeBase(entry.name), `${publicPrefix}/${entry.name}`);
  }

  return map;
}

async function rewriteListJson(fileName, assetMap) {
  const targetPath = path.join(mirrorRoot, fileName);
  const source = JSON.parse(await fs.readFile(targetPath, "utf8"));
  const next = source.map((item) => ({
    ...item,
    thumbnail: assetMap.get(item.slug.toLowerCase()) ?? item.thumbnail,
  }));
  await fs.writeFile(targetPath, `${JSON.stringify(next, null, 2)}\n`);
}

async function rewriteDetailDir(detailsDir, assetMap) {
  const targetDir = path.join(mirrorRoot, detailsDir);
  const entries = await fs.readdir(targetDir);

  for (const entry of entries) {
    if (!entry.endsWith(".json") || entry.includes("manifest")) {
      continue;
    }

    const targetPath = path.join(targetDir, entry);
    const source = JSON.parse(await fs.readFile(targetPath, "utf8"));
    const next = source.map((item) => ({
      ...item,
      listing: item.listing
        ? {
            ...item.listing,
            thumbnail:
              assetMap.get(item.slug.toLowerCase()) ?? item.listing.thumbnail,
          }
        : item.listing,
    }));

    await fs.writeFile(targetPath, `${JSON.stringify(next, null, 2)}\n`);
  }
}

async function rewriteHanimeIndex(coverMap, hanimeThumbnailMap) {
  const targetPath = path.join(mirrorRoot, "hanimeIndex.json");
  const source = JSON.parse(await fs.readFile(targetPath, "utf8"));

  for (const group of Object.values(source.groups)) {
    for (const item of group.items) {
      if (!item.tooltip) {
        continue;
      }

      item.tooltip.image =
        coverMap.get(item.slug.toLowerCase()) ??
        coverMap.get(String(item.id ?? "").toLowerCase()) ??
        item.tooltip.image;

      if (!item.details?.episodes?.length) {
        continue;
      }

      item.details.episodes = item.details.episodes.map((episode) => ({
        ...episode,
        thumbnail:
          hanimeThumbnailMap.get(episode.slug.toLowerCase()) ??
          episode.thumbnail,
      }));
    }
  }

  await fs.writeFile(targetPath, `${JSON.stringify(source, null, 2)}\n`);
}

async function main() {
  console.log(
    write ? "Running sync in write mode" : "Running sync in dry-run mode",
  );
  console.log(`Source: ${externalRoot}`);
  console.log(`Mirror: ${mirrorRoot}`);
  console.log(`Public assets: ${publicRoot}`);

  for (const file of fileCopies) {
    const source = path.join(externalRoot, file);
    const target = path.join(mirrorRoot, file);
    console.log(`JSON: ${file}`);
    await copyFileIfNeeded(source, target);
  }

  for (const detailsDir of detailDirs) {
    console.log(`Details: ${detailsDir}`);
    if (write) {
      await ensureDir(path.join(mirrorRoot, detailsDir));
    }
    await copyDirFiltered(
      path.join(externalRoot, detailsDir),
      path.join(mirrorRoot, detailsDir),
    );
  }

  const assetMaps = new Map();
  for (const dir of thumbnailDirs) {
    const sourceDir = path.join(externalRoot, dir.source);
    const targetDir = path.join(publicRoot, dir.target);
    console.log(`Assets: ${dir.source} -> public/thumbnails/${dir.target}`);

    if (write) {
      await ensureDir(targetDir);
      const entries = await fs.readdir(sourceDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) {
          continue;
        }

        await copyFileIfNeeded(
          path.join(sourceDir, entry.name),
          path.join(targetDir, entry.name),
        );
      }
    }

    assetMaps.set(
      dir.target,
      await buildAssetMap(sourceDir, `/thumbnails/${dir.target}`),
    );
  }

  if (write) {
    for (const [fileName, target] of Object.entries(listThumbnailTargets)) {
      await rewriteListJson(fileName, assetMaps.get(target));
    }

    await rewriteDetailDir("details/hanime", assetMaps.get("hanime"));
    await rewriteDetailDir("details/jav", assetMaps.get("jav"));
    await rewriteDetailDir("details/jav-cosplay", assetMaps.get("jav-cosplay"));
    await rewriteDetailDir(
      "details/2d-animation",
      assetMaps.get("2d-animation"),
    );
    await rewriteDetailDir("details/3d-hentai", assetMaps.get("3d-hentai"));
    await rewriteHanimeIndex(
      assetMaps.get("hanime-cover"),
      assetMaps.get("hanime"),
    );
  }

  console.log("Sync pipeline complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
