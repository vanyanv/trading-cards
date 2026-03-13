export interface AuditEntry {
  packId: string;
  setName: string;
  edition: string | null;
  source: 'tcgplayer' | 'ebay' | 'estimate' | 'skipped';
  price: number | null;
  previousPrice: number | null;
  confidence: number | null;
  matchedProductName: string | null;
  matchedProductId: number | null;
  ebayListingsUsed: number | null;
  flags: string[];
  timestamp: string;
}

export function computeFlags(entry: Partial<AuditEntry>): string[] {
  const flags: string[] = [];

  if (entry.confidence != null && entry.confidence < 0.5) {
    flags.push('low_confidence');
  }

  if (
    entry.previousPrice != null &&
    entry.price != null &&
    entry.previousPrice > 0
  ) {
    const changePct =
      Math.abs(entry.price - entry.previousPrice) / entry.previousPrice;
    if (changePct > 1.0) {
      flags.push('price_change_gt_100pct');
    } else if (changePct > 0.5) {
      flags.push('price_change_gt_50pct');
    }
  }

  if (entry.source === 'ebay' && (entry.ebayListingsUsed ?? 0) < 5) {
    flags.push('few_ebay_listings');
  }

  if (entry.price == null && entry.source !== 'skipped') {
    flags.push('no_price');
  }

  return flags;
}

export class SyncAuditLog {
  private entries: AuditEntry[] = [];

  add(entry: AuditEntry): void {
    this.entries.push(entry);
  }

  getAll(): AuditEntry[] {
    return this.entries;
  }

  getFlagged(): AuditEntry[] {
    return this.entries.filter((e) => e.flags.length > 0);
  }

  getSummary(): {
    total: number;
    flagged: number;
    bySource: Record<string, number>;
  } {
    const bySource: Record<string, number> = {};
    for (const entry of this.entries) {
      bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
    }
    return {
      total: this.entries.length,
      flagged: this.getFlagged().length,
      bySource,
    };
  }

  printFlagged(log: (msg: string) => void): void {
    const flagged = this.getFlagged();
    if (flagged.length === 0) {
      log('\nNo flagged entries.');
      return;
    }

    log(`\n=== FLAGGED ENTRIES (${flagged.length}) ===`);
    for (const entry of flagged) {
      const editionLabel = entry.edition ? ` [${entry.edition}]` : '';
      const priceStr = entry.price != null ? `$${entry.price.toFixed(2)}` : 'N/A';
      const prevStr =
        entry.previousPrice != null ? `$${entry.previousPrice.toFixed(2)}` : 'N/A';
      log(
        `  ${entry.setName}${editionLabel}: ${priceStr} (was ${prevStr}) [${entry.source}] — ${entry.flags.join(', ')}`
      );
    }
  }
}
