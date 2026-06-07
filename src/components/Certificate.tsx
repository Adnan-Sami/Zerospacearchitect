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
        className="relative mx-auto aspect-[1.414/1] w-full max-w-3xl overflow-hidden border-8 border-primary bg-gradient-to-br from-background to-primary/5 p-8 shadow-xl"
        style={{ fontFamily: "serif" }}
      >
        <div className="absolute inset-4 border-2 border-primary/30" />
        <div className="relative flex h-full flex-col items-center justify-center text-center">
          <Award className="mb-3 h-14 w-14 text-primary" />
          <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">
            সার্টিফিকেট অফ কমপ্লিশন
          </p>
          <h1 className="mb-4 text-2xl font-bold text-primary md:text-3xl">
            {title || "কোর্স সমাপ্তি সার্টিফিকেট"}
          </h1>
          <p className="mb-2 text-sm text-muted-foreground">
            এই সার্টিফিকেট প্রদান করা হলো
          </p>
          <h2 className="mb-2 text-2xl font-bold text-foreground md:text-4xl">
            {studentName}
          </h2>
          <p className="mb-2 whitespace-pre-line text-sm text-muted-foreground">
            {body || "সফলভাবে নিম্নলিখিত কোর্সটি সম্পন্ন করার জন্য:"}
          </p>
          <h3 className="mb-6 text-lg font-semibold text-foreground md:text-2xl">
            {courseName}
          </h3>
          <div className="flex w-full items-start justify-between px-6 text-xs text-muted-foreground md:px-8">
            <div className="text-left">
              <p>ইস্যু তারিখ</p>
              <p className="mt-1 font-semibold text-foreground">{issuedDate}</p>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-primary">{siteName}</p>
              {signature && (
                <p className="mt-1 text-[10px] text-foreground">{signature}</p>
              )}
            </div>
            <div className="text-right">
              <p>সার্টিফিকেট নং</p>
              <p className="mt-1 font-mono text-[11px] font-semibold text-foreground">
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
