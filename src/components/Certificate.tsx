"use client";

import { forwardRef } from "react";
import { Award } from "lucide-react";

interface CertificateProps {
  studentName: string;
  courseName: string;
  certificateNumber: string;
  issuedDate: string;
  siteName?: string;
  title?: string;
  body?: string;
  signature?: string;
}

export const Certificate = forwardRef<HTMLDivElement, CertificateProps>(
  (
    {
      studentName,
      courseName,
      certificateNumber,
      issuedDate,
      siteName = "Zero Space Architect",
      title,
      body,
      signature,
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className="relative mx-auto w-full max-w-3xl overflow-hidden border-4 border-primary bg-gradient-to-br from-background to-primary/5 p-4 shadow-xl sm:aspect-[1.414/1] sm:border-8 sm:p-8"
        style={{ fontFamily: "serif" }}
      >
        <div className="absolute inset-2 border border-primary/30 sm:inset-4 sm:border-2" />
        <div className="relative flex h-full flex-col items-center justify-center py-8 text-center sm:py-0">
          <Award className="mb-3 h-10 w-10 text-primary sm:h-14 sm:w-14" />
          <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
            সার্টিফিকেট অফ কমপ্লিশন
          </p>
          <h1 className="mb-3 text-lg font-bold text-primary sm:mb-4 sm:text-2xl md:text-3xl">
            {title || "কোর্স সমাপ্তি সার্টিফিকেট"}
          </h1>
          <p className="mb-2 text-xs text-muted-foreground sm:text-sm">
            এই সার্টিফিকেট প্রদান করা হলো
          </p>
          <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl md:text-4xl">
            {studentName}
          </h2>
          <p className="mb-2 whitespace-pre-line text-xs text-muted-foreground sm:text-sm">
            {body || "সফলভাবে নিম্নলিখিত কোর্সটি সম্পন্ন করার জন্য:"}
          </p>
          <h3 className="mb-4 text-base font-semibold text-foreground sm:mb-6 sm:text-lg md:text-2xl">
            {courseName}
          </h3>
          <div className="flex w-full flex-col items-center gap-3 px-4 text-xs text-muted-foreground sm:flex-row sm:items-start sm:justify-between sm:px-8">
            <div className="text-center sm:text-left">
              <p>ইস্যু তারিখ</p>
              <p className="mt-1 font-semibold text-foreground">{issuedDate}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-primary sm:text-base">{siteName}</p>
              {signature && (
                <p className="mt-1 text-[10px] text-foreground">{signature}</p>
              )}
            </div>
            <div className="text-center sm:text-right">
              <p>সার্টিফিকেট নং</p>
              <p className="mt-1 font-mono text-[10px] font-semibold text-foreground sm:text-[11px]">
                {certificateNumber}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
Certificate.displayName = "Certificate";
