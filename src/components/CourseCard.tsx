"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WishlistButton } from "@/components/WishlistButton";

interface CourseCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  price: number;
  instructorName: string;
  rating?: number;
  reviewCount?: number;
  categoryName?: string;
}

export function CourseCard({
  id,
  title,
  thumbnailUrl,
  price,
  instructorName,
  rating = 0,
  reviewCount = 0,
  categoryName,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <Card className="group relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
        <div className="absolute right-2 top-2 z-10">
          <WishlistButton courseId={id} className="h-8 w-8 rounded-full bg-card/80 backdrop-blur" />
        </div>
        <div className="aspect-video overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              width={400}
              height={225}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              কোর্স
            </div>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col p-4">
          {categoryName && (
            <Badge variant="secondary" className="mb-2 w-fit text-xs">
              {categoryName}
            </Badge>
          )}
          <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="mb-2 text-xs text-muted-foreground">{instructorName || "—"}</p>
          <div className="mb-2 flex items-center gap-1 min-h-[1.25rem]">
            {rating > 0 && (
              <>
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{rating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviewCount})</span>
              </>
            )}
          </div>
          <p className="mt-auto text-base font-bold text-primary">
            ৳{price.toLocaleString("bn-BD")}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
