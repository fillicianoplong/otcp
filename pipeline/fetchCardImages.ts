import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { atomicWriteBytes, atomicWriteUtf8 } from '../src/shared/fs/atomicWrite.ts';
import {
  IMAGE_FETCH_DELAY_MS,
  MAX_CARD_IMAGE_LARGE_BYTES,
  MAX_CARD_IMAGE_SMALL_BYTES,
  OTCP_PIPELINE_USER_AGENT,
} from './constants.ts';
import { sha256Hex, sha256HexFile } from './hash.ts';
import {
  publicCardImagesDir,
  ygoprodeckLargeImageUrl,
  ygoprodeckSmallImageUrl,
} from './imagePaths.ts';

export type CardImageVariant = 'large' | 'small';

export type FetchCardImagesOptions = {
  repoRoot: string;
  cardIds: number[];
  variants?: readonly CardImageVariant[];
  fetchImpl?: typeof fetch;
  userAgent?: string;
  maxAttempts?: number;
  initialBackoffMs?: number;
  delayMs?: number;
};

export type FetchCardImagesResult =
  | { ok: true; downloaded: number; skipped: number }
  | { ok: false; error: string; cardId?: number; variant?: CardImageVariant };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function sidecarPath(imagePath: string): string {
  return `${imagePath}.sha256`;
}

function readSidecarHash(imagePath: string): string | null {
  const path = sidecarPath(imagePath);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8').trim();
  return /^[a-f0-9]{64}$/.test(raw) ? raw : null;
}

function imageAlreadyPresent(imagePath: string): boolean {
  if (!existsSync(imagePath)) return false;
  const sidecar = readSidecarHash(imagePath);
  if (!sidecar) return false;
  try {
    return sha256HexFile(imagePath) === sidecar;
  } catch {
    return false;
  }
}

function maxBytesForVariant(variant: CardImageVariant): number {
  return variant === 'large' ? MAX_CARD_IMAGE_LARGE_BYTES : MAX_CARD_IMAGE_SMALL_BYTES;
}

function upstreamUrl(cardId: number, variant: CardImageVariant): string {
  return variant === 'large' ? ygoprodeckLargeImageUrl(cardId) : ygoprodeckSmallImageUrl(cardId);
}

function localImagePath(repoRoot: string, cardId: number, variant: CardImageVariant): string {
  const root = publicCardImagesDir(repoRoot);
  if (variant === 'small') {
    return join(root, 'small', `${cardId}.jpg`);
  }
  return join(root, `${cardId}.jpg`);
}

function isAllowedImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const normalized = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  return normalized === 'image/jpeg' || normalized === 'image/png' || normalized === 'image/webp';
}

function retryAfterMs(response: Response): number | undefined {
  const header = response.headers.get('retry-after');
  if (!header) return undefined;
  const seconds = Number.parseInt(header, 10);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return undefined;
}

async function downloadImage(
  url: string,
  destPath: string,
  maxBytes: number,
  options: Required<
    Pick<FetchCardImagesOptions, 'fetchImpl' | 'userAgent' | 'maxAttempts' | 'initialBackoffMs'>
  >,
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      const response = await options.fetchImpl(url, {
        headers: {
          Accept: 'image/*',
          'User-Agent': options.userAgent,
        },
      });

      if (response.status === 404) {
        throw new Error(`image not found: HTTP 404`);
      }

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          const wait = retryAfterMs(response) ?? options.initialBackoffMs * 2 ** (attempt - 1);
          if (attempt < options.maxAttempts) {
            await sleep(wait);
            continue;
          }
        }
        throw new Error(`image fetch failed: HTTP ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!isAllowedImageContentType(contentType)) {
        throw new Error(`unexpected Content-Type: ${contentType ?? '(missing)'}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length === 0 || buffer.length > maxBytes) {
        throw new Error(`image size out of bounds (${buffer.length} bytes)`);
      }

      atomicWriteBytes(destPath, buffer);
      atomicWriteUtf8(sidecarPath(destPath), `${sha256Hex(buffer)}\n`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < options.maxAttempts) {
        await sleep(options.initialBackoffMs * 2 ** (attempt - 1));
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function ensureCardImages(
  options: FetchCardImagesOptions,
): Promise<FetchCardImagesResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const userAgent = options.userAgent ?? OTCP_PIPELINE_USER_AGENT;
  const maxAttempts = options.maxAttempts ?? 4;
  const initialBackoffMs = options.initialBackoffMs ?? 1000;
  const delayMs = options.delayMs ?? IMAGE_FETCH_DELAY_MS;

  let downloaded = 0;
  let skipped = 0;

  const variants = options.variants ?? (['large', 'small'] as const);
  const uniqueIds = [...new Set(options.cardIds)].sort((a, b) => a - b);

  for (const cardId of uniqueIds) {
    for (const variant of variants) {
      const destPath = localImagePath(options.repoRoot, cardId, variant);
      if (imageAlreadyPresent(destPath)) {
        skipped += 1;
        continue;
      }

      try {
        await downloadImage(upstreamUrl(cardId, variant), destPath, maxBytesForVariant(variant), {
          fetchImpl,
          userAgent,
          maxAttempts,
          initialBackoffMs,
        });
        downloaded += 1;
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          cardId,
          variant,
        };
      }

      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }
  }

  return { ok: true, downloaded, skipped };
}

export { localImagePath, imageAlreadyPresent };
