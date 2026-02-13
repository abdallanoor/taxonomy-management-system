import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Delete02Icon,
  Edit02Icon,
  BookOpen02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { MaterialData } from "@/lib/data";

interface MaterialCardProps {
  material: MaterialData;
  onEdit: (material: MaterialData) => void;
  onDelete: (id: string) => void;
  isAdmin?: boolean;
}

export function MaterialCard({
  material,
  onEdit,
  onDelete,
  isAdmin,
}: MaterialCardProps) {
  return (
    <div className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border border-foreground/15 bg-sidebar hover:border-foreground/25 transition-all duration-300 ease-out overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-foreground/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-foreground/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-foreground/5 rounded-full blur-3xl pointer-events-none" />

      <Link
        href={`/materials/${material._id}`}
        className="absolute inset-0 z-10"
      />

      <div className="relative z-0 flex flex-col items-center gap-3 text-center w-full">
        <div>
          <HugeiconsIcon icon={BookOpen02Icon} size={32} />
        </div>

        <div className="space-y-1.5 w-full">
          <h3
            className="font-medium text-base text-foreground line-clamp-1"
            title={material.title}
          >
            {material.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {material.author}
          </p>
        </div>
      </div>

      {/* Actions - visible on hover */}
      {isAdmin && (
        <div className="absolute top-2.5 left-2.5 flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-[-8px] sm:group-hover:translate-y-0 transition-all duration-500 z-20">
          <div className="flex items-center gap-1 p-1 bg-transparent backdrop-blur-xl rounded-full border border-foreground/10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(material);
              }}
              title="تعديل"
            >
              <HugeiconsIcon icon={Edit02Icon} size={16} />
            </Button>
            <div className="w-px h-4 bg-foreground/10 mx-0.5" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/20 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(material._id);
              }}
              title="حذف"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
