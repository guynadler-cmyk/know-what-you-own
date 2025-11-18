import OpenAI from "openai";
import { CompanySummary, TemporalAnalysis } from "@shared/schema";

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
    {"name": "Theme name (e.g., AI/ML, Cloud Infrastructure, Electric Vehicles)", "emphasis": "high/medium/low", "explanation": "1-sentence plain-English explanation of what this theme means and why it matters"}
  ],
  "moats": [
    {"name": "Competitive advantage (e.g., Network Effects, Brand Power, Patents, Scale Economies)", "emphasis": "high/medium/low", "explanation": "1-sentence plain-English explanation of how this advantage protects the business"}
  ],
  "marketOpportunity": [
    {"name": "Market descriptor (e.g., TAM: $500B, Growing 20% YoY, International Expansion)", "emphasis": "high/medium/low", "explanation": "1-sentence plain-English explanation of this market opportunity"}
  ],
  "valueCreation": [
    {"name": "Value driver (e.g., Recurring Revenue, High Margins 70%+, Platform Economics)", "emphasis": "high/medium/low", "explanation": "1-sentence plain-English explanation of how this creates shareholder value"}
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
- Extract 3-5 investment themes that represent the company's key strategic focus areas (e.g., AI/ML, Cloud Infrastructure, Electric Vehicles, Drug Development)
- Extract 2-4 moats (competitive advantages) like Network Effects, Brand Power, Patents, Switching Costs, Scale Economies, Proprietary Data, etc.
- Extract 2-4 market opportunity tags describing the addressable market (e.g., TAM: $100B, Growing 15% YoY, Underserved Market, International Expansion)
- Extract 2-4 value creation drivers explaining how they make money (e.g., Recurring Revenue, High Margins 70%+, Asset-Light Model, Platform Economics, Cross-Sell)
- For all tags (themes, moats, opportunities, value creation):
  * Assign emphasis based on prominence in the filing:
    - "high": Core strategy, mentioned frequently throughout, dedicated sections
    - "medium": Important but secondary focus, mentioned several times
    - "low": Mentioned or emerging area, not a primary focus
  * Provide a concise 1-sentence plain-English explanation that non-financial people can understand
  * Explanations should clarify what the term means and why it matters to investors
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
      moats: result.moats || [],
      marketOpportunity: result.marketOpportunity || [],
      valueCreation: result.valueCreation || [],
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

  async analyzeTemporalChanges(
    companyName: string,
    ticker: string,
    yearlyData: Array<{
      fiscalYear: string;
      filingDate: string;
      businessSection: string;
    }>
  ): Promise<TemporalAnalysis> {
    const yearsAnalyzed = yearlyData.map(d => d.fiscalYear).sort();
    
    // Truncate each business section to avoid token limits and timeouts
    const MAX_CHARS_PER_YEAR = 8000;
    
    const sectionsText = yearlyData
      .sort((a, b) => parseInt(a.fiscalYear) - parseInt(b.fiscalYear))
      .map(d => {
        const truncated = d.businessSection.length > MAX_CHARS_PER_YEAR 
          ? d.businessSection.substring(0, MAX_CHARS_PER_YEAR) + "\n\n[...truncated for length...]"
          : d.businessSection;
        return `=== FISCAL YEAR ${d.fiscalYear} (Filed: ${d.filingDate}) ===\n${truncated}`;
      })
      .join('\n\n');

    const prompt = `You are analyzing ${companyName} (${ticker}) across ${yearlyData.length} years of 10-K filings to identify significant changes over time.

Here are the business sections from each year, in chronological order:

${sectionsText}

Analyze these filings to identify:
1. DISCONTINUED ITEMS: Things mentioned in earlier years but dropped/omitted in later filings
2. NEW & SUSTAINED ITEMS: Things introduced in a later year that continued to be reported
3. EVOLVED ITEMS: Descriptions, strategies, or products that changed significantly over time
4. NEW PRODUCTS: Products that were introduced during this period

CRITICAL FILTERING RULES - IGNORE THESE COMPLETELY:
❌ Section headers or labels (e.g., "Business 1", "Business 2", "Item 1", "Part I")
❌ Document structure changes or reorganizations
❌ Generic phrases like "our business", "we operate", "the company"
❌ Boilerplate text or legal disclaimers
❌ Changes in writing style or document formatting
❌ Administrative or procedural updates
❌ Vague or context-free statements

ONLY INCLUDE ITEMS WITH:
✅ Specific product names, service names, or technology names
✅ Concrete market details (specific countries, regions, customer segments)
✅ Named partnerships, acquisitions, or divestitures
✅ Measurable strategic shifts with business substance
✅ Real operational changes (e.g., closing a factory, entering a new market)
✅ Meaningful context that explains WHY this matters to investors

QUALITY OVER QUANTITY: If you cannot find items that meet these strict criteria, return empty arrays. Better to show nothing than show meaningless noise.

Provide a JSON response with this EXACT structure:
{
  "discontinued": [
    {
      "item": "Specific product/strategy/market name (NOT generic text)",
      "category": "product/strategy/market/partnership/initiative",
      "lastMentionedYear": "YYYY",
      "yearsActive": "YYYY-YYYY",
      "context": "One sentence with concrete details explaining what it was and why its disappearance matters"
    }
  ],
  "newAndSustained": [
    {
      "item": "Specific product/strategy/market name (NOT generic text)",
      "category": "product/strategy/market/partnership/initiative",
      "introducedYear": "YYYY",
      "context": "One sentence with concrete details explaining what it is and its significance"
    }
  ],
  "evolved": [
    {
      "item": "Specific product/strategy/market name (NOT generic text)",
      "category": "product/strategy/market/description",
      "yearRange": "YYYY-YYYY",
      "changeDescription": "One sentence with concrete business details describing how it changed",
      "beforeSnapshot": "Specific description from earlier year with concrete business details (max 100 chars)",
      "afterSnapshot": "Specific description from later year with concrete business details (max 100 chars)"
    }
  ],
  "newProducts": [
    {
      "name": "Specific product name (NOT generic description)",
      "introducedYear": "YYYY",
      "description": "Brief description with concrete details (max 80 chars)",
      "significance": "One sentence on why this specific product matters to investors"
    }
  ]
}

Additional Guidelines:
- Prioritize quality over quantity - max 5-6 items per category
- Be specific with year ranges and dates
- Categories should be: product, strategy, market, partnership, initiative, or description
- Keep all text concise and investor-focused
- When in doubt, EXCLUDE the item - only show high-confidence, meaningful changes`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial analyst expert at identifying material changes in SEC filings over time. Focus on investor-relevant changes. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    // Shared function to check if text looks like structural/generic content
    // More forgiving patterns that catch variants with punctuation, suffixes, etc.
    const looksLikeStructuralNoise = (text: string): boolean => {
      const textLower = text.toLowerCase().trim();
      
      // Structural patterns - comprehensive to catch all common variants
      const structuralPatterns = [
        /business\s*\d+/i,                    // "Business 1", "Business 2.", "Business 3 - Overview"
        /item\s*\d+/i,                        // "Item 1", "Item 2.", "Item 1: Business"
        /part\s*[ivi]+/i,                     // "Part I", "Part II", "Part III"
        /section\s*\d+/i,                     // "Section 1", "Section 2"
        /^our business\.?$/i,                 // "our business", "our business."
        /^the company\.?$/i,                  // "the company", "the company."
        /^we operate\.?$/i,                   // "we operate", "we operate."
        /^overview\.?$/i,                     // "overview", "Overview"
        /^description\.?$/i,                  // "description"
        /^general\.?$/i,                      // "general"
        /^business overview/i,                // "Business Overview"
        /^company overview/i,                 // "Company Overview"
        /^corporate overview/i,               // "Corporate Overview"
        /^business description/i,             // "Business Description"
        /^company description/i,              // "Company Description"
        /^company profile/i,                  // "Company Profile"
        /^corporate profile/i,                // "Corporate Profile"
        /^general information/i,              // "General Information"
        /^description of (the\s+)?business/i, // "Description of Business", "Description of the Business"
        /^description of (the\s+)?company/i,  // "Description of Company"
        /^general (business\s+)?description/i,// "General Description", "General Business Description"
        /^company (business\s+)?description/i,// "Company Description", "Company Business Description"
        /^operations overview/i,              // "Operations Overview"
        /^general development/i,              // "General Development of Business"
        /^organizational structure/i,         // "Organizational Structure"
        /^corporate structure/i,              // "Corporate Structure"
        /^the business$/i,                    // "The Business"
        /^summary$/i,                         // "Summary"
        /^background$/i,                      // "Background"
        /^introduction$/i,                    // "Introduction"
      ];
      
      // Also reject if text is very short and generic (likely a header)
      if (textLower.length < 5) {
        return true;
      }
      
      // Return true if ANY pattern matches
      return structuralPatterns.some(pattern => pattern.test(textLower));
    };

    // Safely extract and sanitize arrays with defaults
    const sanitizeDiscontinued = (items: any[]): any[] => {
      return items.filter(item => {
        if (!item || 
            typeof item.item !== 'string' || 
            typeof item.category !== 'string' ||
            typeof item.lastMentionedYear !== 'string' ||
            typeof item.yearsActive !== 'string' ||
            typeof item.context !== 'string') {
          return false;
        }
        
        // Reject structural noise
        if (looksLikeStructuralNoise(item.item)) {
          return false;
        }
        
        // Require minimum substance
        if (item.context.length < 20) {
          return false;
        }
        
        return true;
      });
    };

    const sanitizeNewSustained = (items: any[]): any[] => {
      return items.filter(item => {
        if (!item ||
            typeof item.item !== 'string' ||
            typeof item.category !== 'string' ||
            typeof item.introducedYear !== 'string' ||
            typeof item.context !== 'string') {
          return false;
        }
        
        // Reject structural noise
        if (looksLikeStructuralNoise(item.item)) {
          return false;
        }
        
        // Require minimum substance
        if (item.context.length < 20) {
          return false;
        }
        
        return true;
      });
    };

    const sanitizeEvolved = (items: any[]): any[] => {
      return items.filter(item => {
        if (!item ||
            typeof item.item !== 'string' ||
            typeof item.category !== 'string' ||
            typeof item.yearRange !== 'string' ||
            typeof item.changeDescription !== 'string' ||
            typeof item.beforeSnapshot !== 'string' ||
            typeof item.afterSnapshot !== 'string') {
          return false;
        }
        
        // Reject structural noise in item name or snapshots
        if (looksLikeStructuralNoise(item.item) ||
            looksLikeStructuralNoise(item.beforeSnapshot) ||
            looksLikeStructuralNoise(item.afterSnapshot)) {
          return false;
        }
        
        // Require minimum substance in description
        if (item.changeDescription.length < 20) {
          return false;
        }
        
        return true;
      });
    };

    const sanitizeNewProducts = (items: any[]): any[] => {
      return items.filter(item => {
        if (!item ||
            typeof item.name !== 'string' ||
            typeof item.introducedYear !== 'string' ||
            typeof item.description !== 'string' ||
            typeof item.significance !== 'string') {
          return false;
        }
        
        // Reject structural noise in product name
        if (looksLikeStructuralNoise(item.name)) {
          return false;
        }
        
        // Require minimum substance
        if (item.description.length < 15 || item.significance.length < 20) {
          return false;
        }
        
        return true;
      });
    };

    const discontinued = Array.isArray(result.discontinued) ? sanitizeDiscontinued(result.discontinued) : [];
    const newAndSustained = Array.isArray(result.newAndSustained) ? sanitizeNewSustained(result.newAndSustained) : [];
    const evolved = Array.isArray(result.evolved) ? sanitizeEvolved(result.evolved) : [];
    const newProducts = Array.isArray(result.newProducts) ? sanitizeNewProducts(result.newProducts) : [];

    // Build the temporal analysis with computed summary
    const temporalAnalysis: TemporalAnalysis = {
      summary: {
        yearsAnalyzed,
        discontinuedCount: discontinued.length,
        newSustainedCount: newAndSustained.length,
        evolvedCount: evolved.length,
        newProductsCount: newProducts.length,
      },
      discontinued,
      newAndSustained,
      evolved,
      newProducts,
    };

    return temporalAnalysis;
  }
}

export const openaiService = new OpenAIService();
