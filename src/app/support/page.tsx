"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Phone, Mail, User, MessageSquare } from "lucide-react";
import { useSiteContent } from "@/hooks/use-site-content";

export default function SupportPage() {
  const heroTitle = useSiteContent("support.hero.title");
  const phoneTitle = useSiteContent("support.phone.title");
  const phoneNum = useSiteContent("support.phone.number");
  const emailTitle = useSiteContent("support.email.title");
  const email1 = useSiteContent("support.email.1");
  const email2 = useSiteContent("support.email.2");
  const agentImg = useSiteContent("support.agent.image");
  const chatCta = useSiteContent("support.chat.cta");
  const tut1Title = useSiteContent("support.tutorial.1.title");
  const tut1Video = useSiteContent("support.tutorial.1.video");
  const tut2Title = useSiteContent("support.tutorial.2.title");
  const tut2Video = useSiteContent("support.tutorial.2.video");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <section className="bg-sky-50 py-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[1fr_auto] md:px-8">
          <div>
            <h1 className="mb-6 text-2xl font-bold md:text-3xl">{heroTitle}</h1>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-800">{phoneTitle}</h3>
                <ul className="space-y-2 text-sky-600">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a
                      href={`tel:${phoneNum.replace(/[^+\d]/g, "")}`}
                      className="hover:underline"
                    >
                      {phoneNum}
                    </a>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-800">{emailTitle}</h3>
                <ul className="space-y-2 text-sky-600">
                  <li className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <a href={`mailto:${email1}`} className="hover:underline">
                      {email1}
                    </a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${email2}`} className="hover:underline">
                      {email2}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="relative hidden md:block">
            {agentImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agentImg}
                alt="Support Agent"
                className="h-[280px] w-[320px] rounded-xl object-cover"
              />
            )}
            <a
              href="https://m.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-sky-500 px-5 py-2 text-sm font-medium text-white shadow-lg hover:bg-sky-600"
            >
              <MessageSquare className="h-4 w-4" />
              {chatCta}
            </a>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-2 md:px-8">
          <div className="rounded-2xl bg-sky-50 p-6">
            <h3 className="mb-4 text-center font-bold text-gray-800">
              {tut1Title}
            </h3>
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={tut1Video}
                title={tut1Title}
                className="h-full w-full"
                allowFullScreen
              />
            </div>
          </div>
          <div className="rounded-2xl bg-sky-50 p-6">
            <h3 className="mb-4 text-center font-bold text-gray-800">
              {tut2Title}
            </h3>
            <div className="aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={tut2Video}
                title={tut2Title}
                className="h-full w-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
