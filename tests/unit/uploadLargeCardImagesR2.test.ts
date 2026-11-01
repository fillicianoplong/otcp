import { ListObjectsV2Command, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';

import {
  R2_CARD_IMAGES_PUBLIC_BASE_URL,
  R2_LARGE_IMAGE_CACHE_CONTROL,
} from '../../pipeline/constants.ts';
import {
  publicLargeImageUrl,
  publicSmallImageUrl,
  r2LargeObjectKey,
  r2SmallObjectKey,
  resolveR2PublicBaseUrl,
} from '../../pipeline/imagePaths.ts';
import {
  DEFAULT_WEBP_QUALITY,
  hasR2UploadCredentials,
  jpegToWebpAtQuality,
  r2S3Endpoint,
  uploadCardImagesR2,
  uploadLargeCardImagesR2,
} from '../../pipeline/uploadLargeCardImagesR2.ts';

const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDAREAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AAf/Z',
  'base64',
);

const R2_ENV = {
  R2_ACCOUNT_ID: 'acct',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
};

function imageResponse(body = TINY_JPEG): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'image/jpeg' },
  });
}

type MockPut = {
  Key: string;
  ContentType?: string;
  CacheControl?: string;
  Body?: Buffer;
};

function createMockS3(initialKeys: string[] = []): {
  client: S3Client;
  keys: Set<string>;
  puts: MockPut[];
} {
  const keys = new Set(initialKeys);
  const puts: MockPut[] = [];

  const client = {
    send: async (command: unknown) => {
      if (command instanceof ListObjectsV2Command) {
        const prefix = command.input.Prefix ?? '';
        return {
          Contents: [...keys].filter((Key) => Key.startsWith(prefix)).map((Key) => ({ Key })),
          IsTruncated: false,
        };
      }
      if (command instanceof PutObjectCommand) {
        const input = command.input;
        puts.push({
          Key: input.Key ?? '',
          ContentType: input.ContentType,
          CacheControl: input.CacheControl,
          Body: input.Body as Buffer | undefined,
        });
        if (input.Key) keys.add(input.Key);
        return {};
      }
      throw new Error(`unexpected S3 command: ${String(command)}`);
    },
  } as unknown as S3Client;

  return { client, keys, puts };
}

describe('imagePaths R2 URLs', () => {
  it('builds object keys and public URLs from the configured base', () => {
    expect(r2LargeObjectKey(46986420)).toBe('ygo/large/46986420.webp');
    expect(r2SmallObjectKey(46986420)).toBe('ygo/small/46986420.webp');
    expect(publicLargeImageUrl(46986420, R2_CARD_IMAGES_PUBLIC_BASE_URL)).toBe(
      `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/large/46986420.webp`,
    );
    expect(publicSmallImageUrl(46986420, R2_CARD_IMAGES_PUBLIC_BASE_URL)).toBe(
      `${R2_CARD_IMAGES_PUBLIC_BASE_URL}/ygo/small/46986420.webp`,
    );
  });

  it('prefers R2_PUBLIC_BASE_URL when set', () => {
    expect(resolveR2PublicBaseUrl({ R2_PUBLIC_BASE_URL: 'https://example.test/r2/' })).toBe(
      'https://example.test/r2/',
    );
  });
});

describe('uploadCardImagesR2', () => {
  it('detects missing credentials', () => {
    expect(hasR2UploadCredentials({})).toBe(false);
    expect(hasR2UploadCredentials(R2_ENV)).toBe(true);
  });

  it('builds the R2 S3 endpoint from the account id', () => {
    expect(r2S3Endpoint('abc123')).toBe('https://abc123.r2.cloudflarestorage.com');
  });

  it('skips the step when credentials are missing', async () => {
    const result = await uploadCardImagesR2({ cardIds: [1, 2], env: {} });
    expect(result).toEqual({ ok: true, uploaded: 0, skipped: 0, skippedStep: true });
  });

  it('uses WebP quality 75 by default when converting', async () => {
    const convert = vi.fn(async (_jpeg: Buffer, quality: number) => {
      expect(quality).toBe(DEFAULT_WEBP_QUALITY);
      return Buffer.from('webp');
    });

    await jpegToWebpAtQuality(Buffer.from('jpeg'), 75, convert);
    expect(convert).toHaveBeenCalledOnce();
  });

  it('skips large objects that already exist in R2', async () => {
    const { client, puts } = createMockS3(['ygo/large/46986420.webp']);
    const fetchImpl = vi.fn(async () => imageResponse());

    const result = await uploadCardImagesR2({
      cardIds: [46986420, 89631139],
      variants: ['large'],
      env: R2_ENV,
      s3Client: client,
      fetchImpl: fetchImpl as typeof fetch,
      concurrency: 2,
      minFetchIntervalMs: 0,
    });

    expect(result.ok).toBe(true);
    if (!result.ok || result.skippedStep) throw new Error('expected upload result');
    expect(result.skipped).toBe(1);
    expect(result.uploaded).toBe(1);
    expect(puts).toHaveLength(1);
    expect(puts[0]?.Key).toBe('ygo/large/89631139.webp');
    expect(puts[0]?.ContentType).toBe('image/webp');
    expect(puts[0]?.CacheControl).toBe(R2_LARGE_IMAGE_CACHE_CONTROL);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('uploads small WebP objects under ygo/small/', async () => {
    const { client, puts } = createMockS3();
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain('cards_small/89631139.jpg');
      return imageResponse();
    });

    const result = await uploadCardImagesR2({
      cardIds: [89631139],
      variants: ['small'],
      env: R2_ENV,
      s3Client: client,
      fetchImpl: fetchImpl as typeof fetch,
      minFetchIntervalMs: 0,
    });

    expect(result).toEqual({ ok: true, uploaded: 1, skipped: 0 });
    expect(puts).toHaveLength(1);
    expect(puts[0]?.Key).toBe('ygo/small/89631139.webp');
  });
});

describe('uploadLargeCardImagesR2', () => {
  it('uploads only large variants', async () => {
    const { client, puts } = createMockS3();
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain('/cards/89631139.jpg');
      expect(String(input)).not.toContain('cards_small');
      return imageResponse();
    });

    const result = await uploadLargeCardImagesR2({
      cardIds: [89631139],
      env: R2_ENV,
      s3Client: client,
      fetchImpl: fetchImpl as typeof fetch,
      minFetchIntervalMs: 0,
    });

    expect(result).toEqual({ ok: true, uploaded: 1, skipped: 0 });
    expect(puts).toHaveLength(1);
    expect(puts[0]?.Key).toBe('ygo/large/89631139.webp');
  });
});
