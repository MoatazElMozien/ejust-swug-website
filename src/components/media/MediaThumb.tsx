import Image from "next/image";
import { Boxes } from "lucide-react";
import { AutoVideo } from "./AutoVideo";

type M = { type: "IMAGE" | "VIDEO"; url: string; poster?: string | null; caption?: string | null };

/** Fills its (relatively positioned) parent with the first media item. */
export function MediaThumb({ item, alt, sizes }: { item?: M; alt: string; sizes: string }) {
  if (!item)
    return (
      <div className="absolute inset-0 grid place-items-center bg-panel-2 text-faint">
        <Boxes className="size-10" />
      </div>
    );
  if (item.type === "VIDEO")
    return <AutoVideo src={item.url} poster={item.poster} className="absolute inset-0 size-full object-cover" />;
  return <Image src={item.url} alt={item.caption || alt} fill sizes={sizes} className="object-cover" />;
}
