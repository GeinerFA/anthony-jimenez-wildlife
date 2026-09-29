"use client";

import Image, { type ImageProps } from "next/image";
import { withTransform } from "@/lib/media/cloudinary-url";

/** next/image que delega el redimensionado y el formato (AVIF/WebP) a Cloudinary. */
export function CloudinaryImage({ alt, ...props }: ImageProps & { src: string }) {
  return (
    <Image
      {...props}
      alt={alt}
      loader={({ src, width, quality }) => withTransform(src, `f_auto,q_${quality ?? "auto"},w_${width},c_limit`)}
    />
  );
}
