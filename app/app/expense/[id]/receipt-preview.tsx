"use client";

import Image from "next/image";
import Zoom from "react-medium-image-zoom";

type ReceiptPreviewProps = {
  src: string;
  alt: string;
};

export function ReceiptPreview({ src, alt }: ReceiptPreviewProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Receipt</h2>
        <p className="text-xs text-slate-600">Click image to zoom fullscreen</p>
      </div>

      <div className="max-h-[55vh] overflow-auto rounded-lg border border-slate-200 bg-slate-50">
        <Zoom>
          <Image src={src} alt={alt} width={1200} height={1600} className="h-auto w-full cursor-zoom-in object-contain" unoptimized />
        </Zoom>
      </div>
    </section>
  );
}
