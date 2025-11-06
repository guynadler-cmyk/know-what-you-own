import OpenAI from "openai";
import { CompanySummary } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const ICON_MAPPING: Record<string, string> = {
  smartphone: "Smartphone",
  phone: "Smartphone",
  iphone: "Smartphone",
  mobile: "Smartphone",
  laptop: "Laptop",
  computer: "Laptop",
  mac: "Laptop",
  pc: "Laptop",
  tablet: "Tablet",
  ipad: "Tablet",
  watch: "Watch",
  wearable: "Watch",
  car: "Car",
  vehicle: "Car",
  auto: "Car",
  ev: "Car",
  battery: "Battery",
  energy: "Zap",
  solar: "Zap",
  power: "Zap",
  cloud: "Cloud",
  server: "Server",
  gaming: "Gamepad2",
  xbox: "Gamepad2",
  playstation: "Gamepad2",
  software: "Code",
  app: "Smartphone",
  service: "Globe",
  music: "Music",
  video: "Video",
  streaming: "Tv",
  search: "Search",
  ai: "Brain",
  chip: "Cpu",
  processor: "Cpu",
};

function mapIconName(productName: string): string {
  const lower = productName.toLowerCase();
  for (const [keyword, icon] of Object.entries(ICON_MAPPING)) {
    if (lower.includes(keyword)) {
      return icon;
    }
  }
  return "Package";
}

export class OpenAIService {
  async analyzeBusiness(
    companyName: string,
    ticker: string,
    businessSection: string,
    filingDate: string,
    fiscalYear: string,
    cik: string
  ): Promise<CompanySummary> {
    const prompt = `You are analyzing a company's 10-K filing. Extract structured information from the business description below.

Company: ${companyName} (${ticker})

Business Description:
${businessSection}

Provide a JSON response with this EXACT structure:
{
  "tagline": "One sentence describing what the company does (max 100 chars)",
  "investmentThesis": "2-3 paragraph explanation of how this company believes it will create shareholder value and make investors wealthy. Include: their strategic vision for growth, key competitive advantages/moats, market opportunity, and how their business model converts operations into shareholder returns. Write from management's perspective based on the 10-K.",
  "investmentThemes": [
    {"name": "Theme name (e.g., AI, Electric Vehicles, Drug Development)", "emphasis": "high/medium/low"}
  ],
  "products": [
    {"name": "Product Name", "description": "Brief description (max 50 chars)"}
  ],
  "operations": {
    "regions": ["Region names"],
    "channels": [
      {"name": "Channel name", "explanation": "Brief plain-English explanation of what this channel means (e.g., 'Third-party sellers: Products sold through retailers like Amazon or Best Buy')"}
    ],
    "scale": "Brief description of operational scale"
  },
  "competitors": [
    {"name": "Competitor name", "ticker": "TICKER (if known, otherwise omit)", "focus": "What they compete on"}
  ],
  "leaders": [
    {"name": "Full Name", "role": "Title", "initials": "XX"}
  ],
  "metrics": [
    {"label": "Metric name", "value": "$XXX or number", "trend": "up/down/stable or omit"}
  ],
  "metadata": {
    "homepage": "https://company.com",
    "news": [
      {"title": "Plausible news headline", "source": "Source name", "date": "MMM DD, YYYY", "url": "https://news.google.com/search?q=CompanyName+news"}
    ],
    "videos": [
      {"title": "Plausible video title about the business", "channel": "Channel name", "url": "https://www.youtube.com/results?search_query=CompanyName"}
    ]
  }
}

Requirements:
- Write the investment thesis in 2-3 well-structured paragraphs explaining how the company plans to create shareholder value
- Extract 3-5 investment themes that represent the company's key strategic focus areas (e.g., AI, Cloud Computing, Electric Vehicles, Drug Development, etc.)
- For each theme, assign emphasis based on how prominently it appears in the filing:
  * "high": Core strategy, mentioned frequently throughout, dedicated sections
  * "medium": Important but secondary focus, mentioned several times
  * "low": Mentioned or emerging area, not a primary focus
- Extract 3-6 products maximum
- Include 3-4 competitors with their stock ticker symbols if they are publicly traded companies
- For each sales channel, provide a simple explanation that non-financial people can understand
- Include 3-5 key leaders if mentioned (use initials from first/last name)
- Include 3-4 key metrics (revenue, employees, etc) if mentioned
- Generate 3 plausible news items with Google News search URLs: https://news.google.com/search?q=${ticker}+recent+news
- Generate 3 video resources with YouTube search URLs: https://www.youtube.com/results?search_query=${ticker}+stock+analysis
- Keep all text concise and scannable (except investmentThesis which should be comprehensive)
- Use actual data from the filing when available`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst expert at extracting structured business information from SEC filings. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    const products = result.products?.map((p: any) => ({
      ...p,
      icon: mapIconName(p.name),
    })) || [];

    // Fix URLs: Replace placeholder "#" URLs with actual search URLs
    const news = result.metadata?.news?.map((item: any) => ({
      ...item,
      url: item.url === "#" || !item.url || item.url.includes("CompanyName")
        ? `https://news.google.com/search?q=${encodeURIComponent(ticker)}+recent+news`
        : item.url
    })) || [];

    const videos = result.metadata?.videos?.map((item: any) => ({
      ...item,
      url: item.url === "#" || !item.url || item.url.includes("CompanyName")
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(ticker)}+stock+analysis`
        : item.url
    })) || [];

    const summary: CompanySummary = {
      companyName,
      ticker,
      filingDate: new Date(filingDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      fiscalYear,
      tagline: result.tagline || "Business information",
      investmentThesis: result.investmentThesis || "Investment thesis information not available.",
      investmentThemes: result.investmentThemes || [],
      products,
      operations: result.operations || {
        regions: [],
        channels: [],
        scale: "Information not available",
      },
      competitors: result.competitors || [],
      leaders: result.leaders || [],
      metrics: result.metrics || [],
      metadata: {
        homepage: result.metadata?.homepage || `https://${ticker.toLowerCase()}.com`,
        investorRelations: result.metadata?.investorRelations,
        news,
        videos,
      },
      cik,
    };

    return summary;
  }
}

export const openaiService = new OpenAIService();
