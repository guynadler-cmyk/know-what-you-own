import axios from "axios";

interface CompanyTickerMapping {
  cik_str: number;
  ticker: string;
  title: string;
}

interface SECSubmission {
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
    };
  };
  name: string;
}

const SEC_HEADERS = {
  "User-Agent": "Know What You Own info@restnvest.com",
  "Accept-Encoding": "gzip, deflate"
};

export class SECService {
  private tickerCache: Map<string, CompanyTickerMapping> = new Map();

  async getCompanyInfo(ticker: string): Promise<{ cik: string; name: string }> {
    const upperTicker = ticker.toUpperCase();
    
    if (!this.tickerCache.size) {
      await this.loadTickerMappings();
    }

    const company = this.tickerCache.get(upperTicker);
    if (!company) {
      throw new Error(`Ticker ${ticker} not found`);
    }

    const cik = String(company.cik_str).padStart(10, '0');
    return { cik, name: company.title };
  }

  async getLatest10K(cik: string): Promise<{
    accessionNumber: string;
    filingDate: string;
    fiscalYear: string;
  }> {
    const url = `https://data.sec.gov/submissions/CIK${cik}.json`;
    
    const response = await axios.get<SECSubmission>(url, { headers: SEC_HEADERS });
    const { filings } = response.data;

    const index = filings.recent.form.findIndex(form => form === "10-K");
    
    if (index === -1) {
      throw new Error("No 10-K filing found");
    }

    const accessionNumber = filings.recent.accessionNumber[index];
    const filingDate = filings.recent.filingDate[index];
    const fiscalYear = new Date(filingDate).getFullYear().toString();

    return { accessionNumber, filingDate, fiscalYear };
  }

  async get10KBusinessSection(cik: string, accessionNumber: string): Promise<string> {
    const accessionPath = accessionNumber.replace(/-/g, '');
    const url = `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accessionPath}/${accessionNumber}.txt`;
    
    const response = await axios.get(url, { headers: SEC_HEADERS });
    const text = response.data;

    // Try multiple regex patterns to handle different 10-K formatting
    const patterns = [
      // Standard format: ITEM 1. Business ... ITEM 1A
      'ITEM\\s+1[\\.\\:\\-]?\\s*Business(.*?)ITEM\\s+1A',
      // Alternative: ITEM 1 ... ITEM 1A (Business might be on new line)
      'ITEM\\s+1[\\.\\:\\-]?\\s*[\\r\\n]*(.*?)ITEM\\s+1A',
      // Looser pattern: Look for ITEM 1 followed by content until next ITEM
      'ITEM\\s+1[\\.\\:\\-]?\\s*(?:Business)?[\\r\\n]*(.*?)(?:ITEM\\s+(?:1A|1B|2))',
    ];

    let businessMatch = null;
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'is');
      businessMatch = text.match(regex);
      if (businessMatch) break;
    }

    if (!businessMatch || !businessMatch[1]) {
      console.error(`Failed to extract business section for CIK ${cik}, accession ${accessionNumber}`);
      throw new Error("Could not extract business section from 10-K");
    }

    let businessSection = businessMatch[1];
    
    // Clean up HTML tags and entities
    businessSection = businessSection
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Return first 15000 characters for the business section
    return businessSection.slice(0, 15000);
  }

  private async loadTickerMappings(): Promise<void> {
    const url = "https://www.sec.gov/files/company_tickers.json";
    const response = await axios.get(url, { headers: SEC_HEADERS });
    
    const data = response.data;
    
    for (const key in data) {
      const company = data[key] as CompanyTickerMapping;
      this.tickerCache.set(company.ticker.toUpperCase(), company);
    }
  }
}

export const secService = new SECService();
