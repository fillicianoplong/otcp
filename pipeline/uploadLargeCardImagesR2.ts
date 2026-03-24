import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

import {
  R2_CARD_IMAGES_BUCKET,
  R2_LARGE_IMAGE_CACHE_CONTROL,
  R2_LARGE_IMAGE_UPLOAD_CONCURRENCY,
  YGOPRODECK_IMAGE_MAX_INTERVAL_MS,
  MAX_CARD_IMAGE_LARGE_BYTES,
  MAX_CARD_IMAGE_SMALL_BYTES,
  OTCP_PIPELINE_USER_AGENT,
} from './constants.ts';
import {
  r2LargeObjectKey,
  r2SmallObjectKey,
  ygoprodeckLargeImageUrl,
  ygoprodeckSmallImageUrl,
} from './imagePaths.ts';

export type R2UploadEnv = Record<string, string | undefined>;

export type CardImageR2Variant = 'large' | 'small';

export type UploadCardImagesR2Options = {
  cardIds: number[];
  variants?: readonly CardImageR2Variant[];
  env?: R2UploadEnv;
  s3Client?: S3Client;
  fetchImpl?: typeof fetch;
  userAgent?: string;
  maxAttempts?: number;
  initialBackoffMs?: number;
  concurrency?: number;
  minFetchIntervalMs?: number;
  webpQuality?: number;
};

/** @deprecated Use {@link UploadCardImagesR2Options} */
export type UploadLargeCardImagesR2Options = Omit<UploadCardImagesR2Options, 'variants'>;

export type UploadCardImagesR2Result =
  | { ok: true; uploaded: number; skipped: number; skippedStep?: false }
  | { ok: true; uploaded: 0; skipped: 0; skippedStep: true }
  | { ok: false; error: string; cardId?: number; variant?: CardImageR2Variant };

/** @deprecated Use {@link UploadCardImagesR2Result} */
export type UploadLargeCardImagesR2Result = UploadCardImagesR2Result;

export type SharpWebpConverter = (jpeg: Buffer, quality: number) => Promise<Buffer>;

const DEFAULT_WEBP_QUALITY = 75;

const DEFAULT_VARIANTS: readonly CardImageR2Variant[] = ['large', 'small'];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function hasR2UploadCredentials(env: R2UploadEnv): boolean {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);
}

export function r2S3Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function createR2S3Client(env: R2UploadEnv): S3Client {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials are incomplete');
  }

  return new S3Client({
    region: 'auto',
    endpoint: r2S3Endpoint(accountId),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function jpegToWebpAtQuality(
  jpeg: Buffer,
  quality: number,
  convert: SharpWebpConverter = defaultSharpWebp,
): Promise<Buffer> {
  return convert(jpeg, quality);
}

async function defaultSharpWebp(jpeg: Buffer, quality: number): Promise<Buffer> {
  return sharp(jpeg).webp({ quality }).toBuffer();
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

function isAllowedImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const normalized = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
  return normalized === 'image/jpeg' || normalized === 'image/png' || normalized === 'image/webp';
}

function r2ListPrefix(variant: CardImageR2Variant): string {
  return variant === 'large' ? 'ygo/large/' : 'ygo/small/';
}

function r2ObjectKey(cardId: number, variant: CardImageR2Variant): string {
  return variant === 'large' ? r2LargeObjectKey(cardId) : r2SmallObjectKey(cardId);
}

function ygoprodeckImageUrl(cardId: number, variant: CardImageR2Variant): string {
  return variant === 'large' ? ygoprodeckLargeImageUrl(cardId) : ygoprodeckSmallImageUrl(cardId);
}

function maxBytesForVariant(variant: CardImageR2Variant): number {
  return variant === 'large' ? MAX_CARD_IMAGE_LARGE_BYTES : MAX_CARD_IMAGE_SMALL_BYTES;
}

class FetchRateLimiter {
  private chain = Promise.resolve();

  constructor(private readonly minIntervalMs: number) {}

  wait(): Promise<void> {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.chain = this.chain.then(async () => {
      await sleep(this.minIntervalMs);
      release();
    });
    return gate;
  }
}

async function listExistingKeys(client: S3Client, prefix: string): Promise<Set<string>> {
  const keys = new Set<string>();
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: R2_CARD_IMAGES_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const object of response.Contents ?? []) {
      if (object.Key) keys.add(object.Key);
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

async function downloadYgoprodeckJpeg(
  cardId: number,
  variant: CardImageR2Variant,
  options: Required<
    Pick<UploadCardImagesR2Options, 'fetchImpl' | 'userAgent' | 'maxAttempts' | 'initialBackoffMs'>
  >,
): Promise<Buffer> {
  const url = ygoprodeckImageUrl(cardId, variant);
  const maxBytes = maxBytesForVariant(variant);
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
        throw new Error('image not found: HTTP 404');
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
      return buffer;
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

async function uploadWebp(
  client: S3Client,
  cardId: number,
  variant: CardImageR2Variant,
  body: Buffer,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: R2_CARD_IMAGES_BUCKET,
      Key: r2ObjectKey(cardId, variant),
      Body: body,
      ContentType: 'image/webp',
      CacheControl: R2_LARGE_IMAGE_CACHE_CONTROL,
    }),
  );
}

type UploadWorkItem = { cardId: number; variant: CardImageR2Variant };

export async function uploadCardImagesR2(
  options: UploadCardImagesR2Options,
): Promise<UploadCardImagesR2Result> {
  const env = options.env ?? {};
  if (!hasR2UploadCredentials(env)) {
    return { ok: true, uploaded: 0, skipped: 0, skippedStep: true };
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const userAgent = options.userAgent ?? OTCP_PIPELINE_USER_AGENT;
  const maxAttempts = options.maxAttempts ?? 4;
  const initialBackoffMs = options.initialBackoffMs ?? 1000;
  const concurrency = options.concurrency ?? R2_LARGE_IMAGE_UPLOAD_CONCURRENCY;
  const minFetchIntervalMs = options.minFetchIntervalMs ?? YGOPRODECK_IMAGE_MAX_INTERVAL_MS;
  const webpQuality = options.webpQuality ?? DEFAULT_WEBP_QUALITY;
  const variants = options.variants ?? DEFAULT_VARIANTS;

  const client = options.s3Client ?? createR2S3Client(env);
  const existingByVariant = new Map<CardImageR2Variant, Set<string>>();
  for (const variant of variants) {
    existingByVariant.set(variant, await listExistingKeys(client, r2ListPrefix(variant)));
  }

  const uniqueIds = [...new Set(options.cardIds)].sort((a, b) => a - b);
  const toUpload: UploadWorkItem[] = [];
  let skipped = 0;

  for (const cardId of uniqueIds) {
    for (const variant of variants) {
      const existing = existingByVariant.get(variant)!;
      if (existing.has(r2ObjectKey(cardId, variant))) {
        skipped += 1;
      } else {
        toUpload.push({ cardId, variant });
      }
    }
  }

  if (toUpload.length === 0) {
    return { ok: true, uploaded: 0, skipped };
  }

  const limiter = new FetchRateLimiter(minFetchIntervalMs);
  let uploaded = 0;
  let failure: { error: string; cardId: number; variant: CardImageR2Variant } | undefined;
  let workIndex = 0;

  async function worker(): Promise<void> {
    while (!failure) {
      const current = workIndex;
      workIndex += 1;
      if (current >= toUpload.length) break;

      const { cardId, variant } = toUpload[current]!;

      try {
        await limiter.wait();
        const jpeg = await downloadYgoprodeckJpeg(cardId, variant, {
          fetchImpl,
          userAgent,
          maxAttempts,
          initialBackoffMs,
        });
        const webp = await jpegToWebpAtQuality(jpeg, webpQuality);
        await uploadWebp(client, cardId, variant, webp);
        uploaded += 1;
      } catch (error) {
        failure = {
          cardId,
          variant,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, toUpload.length) }, () => worker()));

  if (failure) {
    return { ok: false, error: failure.error, cardId: failure.cardId, variant: failure.variant };
  }

  return { ok: true, uploaded, skipped };
}

export async function uploadLargeCardImagesR2(
  options: UploadLargeCardImagesR2Options,
): Promise<UploadLargeCardImagesR2Result> {
  return uploadCardImagesR2({ ...options, variants: ['large'] });
}

export { DEFAULT_WEBP_QUALITY, defaultSharpWebp };
