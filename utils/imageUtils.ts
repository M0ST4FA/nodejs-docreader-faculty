import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { JSDOM } from 'jsdom';

/**
 * Compresses a base64 image and saves it to public/image.
 * Returns the new relative URL for the image.
 */
export async function compressAndSaveImage(base64: string): Promise<string> {
  const matches = base64.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 image');

  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const filename = `${Math.floor(
    Math.random() * 1_000_000_000,
  )}-${Date.now()}.${ext}`;
  const outputPath = path.join(__dirname, '../public/image', filename);

  await sharp(buffer).toFormat('jpeg').jpeg({ quality: 80 }).toFile(outputPath);
  return `/image/${filename}`;
}

/**
 * Deletes a file safely.
 */
export function deleteFile(relativePath: string) {
  const filePath = path.join(
    __dirname,
    '../public',
    relativePath.replace(/^\//, ''),
  );
  try {
    fs.unlink(filePath);
  } catch (err) {
    console.warn(`Failed to delete file: ${filePath}`, err);
  }
}

/**
 * Processes all <img> tags in HTML:
 * - compresses base64 images
 * - replaces src with new path
 * - deletes old images if provided
 */
export async function processHtmlImages(
  html: string,
  oldImages: string[] = [],
): Promise<string> {
  const dom = new JSDOM(html);
  const imgs = Array.from(dom.window.document.querySelectorAll('img'));

  for (const img of imgs) {
    const src = img.getAttribute('src');
    if (!src) continue;

    // Compress new base64 images
    if (src.startsWith('data:image/')) {
      const newSrc = await compressAndSaveImage(src);
      img.setAttribute('src', newSrc);

      // Delete old images if any
      for (const oldImg of oldImages) deleteFile(oldImg);
    }
  }

  return dom.serialize();
}

/**
 * Deletes all relative images found in HTML.
 */
export function deleteImagesInHtml(html: string) {
  const dom = new JSDOM(html);
  const imgs = Array.from(dom.window.document.querySelectorAll('img'));

  for (const img of imgs) {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('data:'))
      deleteFile(src);
  }
}
