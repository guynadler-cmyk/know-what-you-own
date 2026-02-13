import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Search, ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqSections = [
  {
    title: "About Restnvest",
    questions: [
      {
        q: "What is Restnvest?",
        a: "Restnvest is a free, AI-powered research tool that helps you understand public companies before you invest. It reads SEC 10-K filings and transforms them into clear, structured analysis covering business fundamentals, competitive positioning, financial health, and market timing.",
      },
      {
        q: "Who is Restnvest for?",
        a: "Restnvest is built for individual investors who want to understand the businesses behind the stocks they own or are considering. Whether you're a beginner learning how to evaluate companies or an experienced investor looking for a faster research workflow, Restnvest gives you the clarity you need.",
      },
      {
        q: "Is Restnvest investment advice?",
        a: "No. Restnvest is an informational tool that presents analysis and data to help you make your own decisions. We never tell you what to buy, sell, or hold. All investment decisions are yours alone. Always consult a qualified financial advisor for personalized advice.",
      },
    ],
  },
  {
    title: "Data & Analysis",
    questions: [
      {
        q: "Where does the data come from?",
        a: "All company filings come directly from the SEC's official EDGAR database — the same source used by Wall Street analysts, hedge funds, and institutional investors. We access filings in real-time, so you always get the latest available data.",
      },
      {
        q: "How does the AI analysis work?",
        a: "Restnvest uses advanced language models to read and interpret SEC 10-K filings. The AI extracts key information about the business model, competitive landscape, financial performance, and strategic direction, then presents it in a structured, easy-to-understand format following a professional investment framework.",
      },
      {
        q: "How accurate is the analysis?",
        a: "The AI is highly capable at extracting and summarizing information from financial documents. However, like any tool, it's not infallible. We recommend using Restnvest as a starting point for your research, not as your sole source. Cross-reference important findings with the original filings when making significant investment decisions.",
      },
      {
        q: "Which companies can I research?",
        a: "You can research any publicly traded U.S. company that files 10-K reports with the SEC. This covers thousands of companies across all major exchanges including NYSE and NASDAQ.",
      },
      {
        q: "How current is the analysis?",
        a: "Restnvest pulls the most recent 10-K filing available on SEC EDGAR. Companies typically file their 10-K within 60-90 days after their fiscal year end. The analysis reflects the latest filed annual report.",
      },
    ],
  },
  {
    title: "Pricing & Access",
    questions: [
      {
        q: "Is Restnvest really free?",
        a: "Yes. Restnvest is completely free to use with no signup required. You can research unlimited companies and access the full five-stage analysis at no cost.",
      },
      {
        q: "Do I need to create an account?",
        a: "No. You can start researching companies immediately without creating an account or providing any personal information.",
      },
      {
        q: "Will there be a paid version?",
        a: "We're developing a Pro tier with advanced features like portfolio watchlists, multi-year filing comparisons, custom alerts, and exportable PDF reports. Core research features will always remain free.",
      },
    ],
  },
  {
    title: "Technical",
    questions: [
      {
        q: "Can I install Restnvest on my phone?",
        a: "Yes. Restnvest is a Progressive Web App (PWA), which means you can install it directly from your browser on both iOS and Android devices. It works like a native app with fast loading and offline access to previously viewed research.",
      },
      {
        q: "Is my research data stored?",
        a: "Company analyses are generated in real-time and are not permanently stored on our servers. Your research session data stays in your browser. We don't track which companies you research or build profiles based on your activity.",
      },
      {
        q: "Can I share my research?",
        a: "Yes. Each analysis generates a shareable link that you can send to others. They'll be able to see the same analysis you're viewing without needing an account.",
      },
    ],
  },
];

export default function FAQPage() {
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText("product@restnvest.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <SiteLayout>
      <Helmet>
        <title>FAQ - Restnvest</title>
        <meta
          name="description"
          content="Frequently asked questions about Restnvest — data sources, AI analysis, pricing, and how our free stock research tool works."
        />
        <meta property="og:title" content="FAQ - Restnvest" />
        <meta
          property="og:description"
          content="Common questions about Restnvest's AI-powered stock research platform."
        />
        <link rel="canonical" href="https://restnvest.com/faq" />
      </Helmet>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8" data-testid="section-faq-hero">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase" data-testid="text-faq-eyebrow">
            FAQ
          </p>
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]"
            data-testid="text-faq-headline"
          >
            Frequently asked questions
          </h1>
          <p
            className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            data-testid="text-faq-subheadline"
          >
            Everything you need to know about how Restnvest works, where the data comes from, and what it costs.
          </p>
        </div>
      </section>

      <section className="pb-20 sm:pb-24 px-4 sm:px-6 lg:px-8" data-testid="section-faq-content">
        <div className="mx-auto max-w-3xl space-y-10">
          {faqSections.map((section) => (
            <div key={section.title}>
              <h2
                className="text-lg font-semibold mb-4"
                data-testid={`text-faq-section-${section.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {section.title}
              </h2>
              <Accordion type="multiple" className="space-y-2">
                {section.questions.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`${section.title}-${i}`}
                    className="border rounded-md px-4"
                    data-testid={`accordion-faq-${section.title.toLowerCase().replace(/\s+/g, "-")}-${i}`}
                  >
                    <AccordionTrigger className="text-sm font-medium text-left py-3 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-3">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-muted/30" data-testid="section-faq-cta">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-faq-cta-headline">
            Still have questions?
          </h2>
          <p className="mt-3 text-muted-foreground">
            The best way to understand Restnvest is to try it. Or reach out — we're happy to help.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/app">
              <Button size="lg" className="rounded-full gap-2" data-testid="button-faq-cta">
                <Search className="h-5 w-5" />
                Try It Free
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="rounded-full" onClick={copyEmail} data-testid="button-faq-contact">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Contact Us"}
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
