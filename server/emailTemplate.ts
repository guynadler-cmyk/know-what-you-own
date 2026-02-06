interface TrancheEmailData {
  index: number;
  amount: number;
  when?: any;
  trigger?: string;
  gate?: { type: string };
  gateEnabled?: boolean;
}

interface StrategyEmailPlan {
  ticker: string;
  companyName?: string;
  convictionValue: number;
  convictionLabel: string;
  trancheCount: number;
  totalAmount: number;
  tranches: TrancheEmailData[];
  imWrongIf: string;
  snapshot: {
    fundamentals: string;
    valuation: string;
    timing: string;
  };
  takeawayTexts?: {
    performance: string;
    valuation: string;
    timing: string;
  };
  createdAt: string;
}

interface EmailLinks {
  analysisUrl: string;
  strategyUrl: string;
}

const GATE_LABELS: Record<string, string> = {
  none: "",
  fundamentals_ok: "Fundamentals still look healthy",
  not_wrong_if: "My 'I'm wrong if...' conditions are NOT true",
  reread_takeaways: "I've re-read the takeaways",
  manual: "Manual check (I'll decide)",
};

function formatWhen(w: any): string {
  if (!w || typeof w !== "object") {
    const legacyLabels: Record<string, string> = {
      now: "Now / soon",
      earnings: "After next earnings",
      "30days": "In 30 days",
      recheck: "After I re-check fundamentals",
      manual: "Manual / I'll decide",
    };
    return legacyLabels[w] || String(w);
  }
  switch (w.type) {
    case "now": return "Now / soon";
    case "earnings": return "After next earnings";
    case "days": return `In ${w.days || 30} days`;
    case "date":
      return w.dateISO
        ? new Date(w.dateISO).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Specific date";
    case "manual": return "Manual / I'll decide";
    default: return String(w.type);
  }
}

function formatCurrency(amount: number): string {
  return "$" + new Intl.NumberFormat("en-US").format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderStrategyEmail(plan: StrategyEmailPlan, links: EmailLinks): string {
  const ticker = escapeHtml(plan.ticker);
  const company = plan.companyName ? escapeHtml(plan.companyName) : "";
  const createdDate = formatDate(plan.createdAt);
  const totalFormatted = formatCurrency(plan.totalAmount);
  const safeAnalysisUrl = escapeHtml(links.analysisUrl);
  const safeStrategyUrl = escapeHtml(links.strategyUrl);

  const takeaways = plan.takeawayTexts || {
    performance: plan.snapshot.fundamentals,
    valuation: plan.snapshot.valuation,
    timing: plan.snapshot.timing,
  };

  const trancheRows = plan.tranches
    .map((t) => {
      const whenLabel = escapeHtml(t.when ? formatWhen(t.when) : formatWhen(t.trigger));
      const gateLabel =
        t.gateEnabled && t.gate?.type && t.gate.type !== "none"
          ? escapeHtml(GATE_LABELS[t.gate.type] || "")
          : "";
      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #374151;">
            Step ${t.index}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; font-weight: 600; color: #111827;">
            ${formatCurrency(t.amount)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 14px; color: #374151;">
            ${whenLabel}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #6b7280;">
            ${gateLabel || "&mdash;"}
          </td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${ticker} Strategy Plan</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!-- Main container -->
        <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width: 640px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);">

          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px 20px 32px; border-bottom: 1px solid #f0f0f0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size: 16px; font-weight: 700; color: #0d9488; letter-spacing: -0.3px;">
                    restnvest
                  </td>
                  <td align="right" style="font-size: 13px; color: #9ca3af;">
                    ${createdDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero / Title -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">
                Your ${ticker} Strategy Plan
              </h1>
              ${company ? `<p style="margin: 0 0 16px 0; font-size: 15px; color: #6b7280;">${company}</p>` : ""}
              <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.6;">
                Here's the plan you created in restnvest. You can revisit your research and update your steps anytime.
              </p>
            </td>
          </tr>

          <!-- CTA Buttons -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 12px;">
                    <a href="${safeAnalysisUrl}" target="_blank" style="display: inline-block; padding: 10px 24px; background-color: #0d9488; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; letter-spacing: 0.1px;">
                      View full analysis
                    </a>
                  </td>
                  <td>
                    <a href="${safeStrategyUrl}" target="_blank" style="display: inline-block; padding: 10px 24px; background-color: #ffffff; color: #0d9488; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; border: 1.5px solid #0d9488; letter-spacing: 0.1px;">
                      Edit this plan
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="border-top: 1px solid #f0f0f0;"></div>
            </td>
          </tr>

          <!-- Research Takeaways -->
          <tr>
            <td style="padding: 28px 32px 8px 32px;">
              <h2 style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px;">
                Research Takeaways
              </h2>
            </td>
          </tr>

          <!-- Performance -->
          <tr>
            <td style="padding: 0 32px 12px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px;">Performance</p>
                    <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">${escapeHtml(takeaways.performance)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Valuation -->
          <tr>
            <td style="padding: 0 32px 12px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px;">Valuation</p>
                    <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">${escapeHtml(takeaways.valuation)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Timing -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px;">Timing</p>
                    <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5;">${escapeHtml(takeaways.timing)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="border-top: 1px solid #f0f0f0;"></div>
            </td>
          </tr>

          <!-- Plan Summary -->
          <tr>
            <td style="padding: 28px 32px 8px 32px;">
              <h2 style="margin: 0 0 20px 0; font-size: 14px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px;">
                Plan Summary
              </h2>
            </td>
          </tr>

          <!-- Conviction + Amount -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <p style="margin: 0 0 2px 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px;">Conviction</p>
                          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">${escapeHtml(plan.convictionLabel)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px;">
                      <tr>
                        <td style="padding: 14px 16px;">
                          <p style="margin: 0 0 2px 0; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px;">Total Amount</p>
                          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #111827;">${totalFormatted}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tranches Table -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #e5e7eb;">Step</th>
                    <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #e5e7eb;">Amount</th>
                    <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #e5e7eb;">When</th>
                    <th style="padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 1px solid #e5e7eb;">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  ${trancheRows}
                </tbody>
              </table>
            </td>
          </tr>

          ${plan.imWrongIf ? `
          <!-- I'm wrong if -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 6px; border: 1px solid #fde68a;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">I'm wrong if...</p>
                    <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">${escapeHtml(plan.imWrongIf)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                restnvest provides research tools and planning structure, not investment advice. Your plan is saved on your device and in this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                Reply to this email if you want to share feedback.
              </p>
            </td>
          </tr>

        </table>
        <!-- End main container -->

      </td>
    </tr>
  </table>
  <!-- End outer wrapper -->

</body>
</html>`;
}
