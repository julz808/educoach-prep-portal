/**
 * Snapshot Exporter
 *
 * Exports weekly snapshots to JSON files for:
 * - Debugging and auditing
 * - Re-running AI analysis
 * - Backup and recovery
 */

import fs from 'fs';
import path from 'path';
import type {
  WeeklyCampaignSnapshot,
  WeeklyKeywordSnapshot,
  WeeklyAdCopySnapshot,
} from './weekly-data-collector';

export interface WeeklySnapshot {
  metadata: {
    version: string;
    week_start: string;
    week_end: string;
    collected_at: string;
    data_quality_score: number;
  };
  campaigns: WeeklyCampaignSnapshot[];
  keywords: WeeklyKeywordSnapshot[];
  adCopy: WeeklyAdCopySnapshot[];
}

export class SnapshotExporter {
  private snapshotDir: string;

  constructor(baseDir: string = './data/snapshots') {
    this.snapshotDir = path.resolve(process.cwd(), baseDir);
    this.ensureDirectoryExists();
  }

  /**
   * Ensure snapshot directory exists
   */
  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  /**
   * Export snapshot to JSON file
   */
  export(
    weekStart: string,
    weekEnd: string,
    campaigns: WeeklyCampaignSnapshot[],
    keywords: WeeklyKeywordSnapshot[],
    adCopy: WeeklyAdCopySnapshot[],
    dataQualityScore: number = 100
  ): string {
    const snapshot: WeeklySnapshot = {
      metadata: {
        version: '1.0',
        week_start: weekStart,
        week_end: weekEnd,
        collected_at: new Date().toISOString(),
        data_quality_score: dataQualityScore,
      },
      campaigns,
      keywords,
      adCopy,
    };

    // Generate filename
    const filename = `${weekStart}_${weekEnd}.json`;
    const filepath = path.join(this.snapshotDir, filename);

    // Write JSON file
    fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2), 'utf8');

    return filepath;
  }

  /**
   * Import snapshot from JSON file
   */
  import(weekStart: string, weekEnd: string): WeeklySnapshot | null {
    const filename = `${weekStart}_${weekEnd}.json`;
    const filepath = path.join(this.snapshotDir, filename);

    if (!fs.existsSync(filepath)) {
      return null;
    }

    const content = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(content) as WeeklySnapshot;
  }

  /**
   * List all available snapshots
   */
  listSnapshots(): Array<{ weekStart: string; weekEnd: string; filepath: string }> {
    const files = fs.readdirSync(this.snapshotDir);

    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const [weekStart, weekEnd] = file.replace('.json', '').split('_');
        return {
          weekStart,
          weekEnd,
          filepath: path.join(this.snapshotDir, file),
        };
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart)); // Newest first
  }

  /**
   * Get latest snapshot
   */
  getLatest(): WeeklySnapshot | null {
    const snapshots = this.listSnapshots();
    if (snapshots.length === 0) return null;

    const latest = snapshots[0];
    return this.import(latest.weekStart, latest.weekEnd);
  }

  /**
   * Delete old snapshots (keep last N weeks)
   */
  cleanup(keepLastNWeeks: number = 12): number {
    const snapshots = this.listSnapshots();

    if (snapshots.length <= keepLastNWeeks) {
      return 0;
    }

    const toDelete = snapshots.slice(keepLastNWeeks);
    let deletedCount = 0;

    for (const snapshot of toDelete) {
      try {
        fs.unlinkSync(snapshot.filepath);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete ${snapshot.filepath}:`, error);
      }
    }

    return deletedCount;
  }

  /**
   * Print export summary
   */
  static printExportSummary(filepath: string, snapshot: WeeklySnapshot): void {
    const fileSize = fs.statSync(filepath).size;
    const fileSizeKB = Math.round(fileSize / 1024);

    console.log('\n💾 Snapshot Export');
    console.log('═══════════════════════════════════════');
    console.log(`📁 File: ${path.basename(filepath)}`);
    console.log(`📊 Size: ${fileSizeKB} KB`);
    console.log(`📅 Week: ${snapshot.metadata.week_start} to ${snapshot.metadata.week_end}`);
    console.log(`⭐ Quality: ${snapshot.metadata.data_quality_score}/100`);
    console.log(`\nContents:`);
    console.log(`  • ${snapshot.campaigns.length} campaigns`);
    console.log(`  • ${snapshot.keywords.length} keywords`);
    console.log(`  • ${snapshot.adCopy.length} ads`);
    console.log('═══════════════════════════════════════\n');
  }

  /**
   * Generate human-readable summary report
   */
  generateSummaryReport(snapshot: WeeklySnapshot): string {
    const lines: string[] = [];

    lines.push('═══════════════════════════════════════════════════════════');
    lines.push(`  GOOGLE ADS WEEKLY SNAPSHOT REPORT`);
    lines.push(`  Week: ${snapshot.metadata.week_start} to ${snapshot.metadata.week_end}`);
    lines.push(`  Collected: ${new Date(snapshot.metadata.collected_at).toLocaleString()}`);
    lines.push(`  Quality Score: ${snapshot.metadata.data_quality_score}/100`);
    lines.push('═══════════════════════════════════════════════════════════\n');

    // Campaign summary
    lines.push('📊 CAMPAIGNS\n');
    lines.push(
      'Campaign Name                  | Product         | Impr.  | Clicks | Conv. | CAC    | Status'
    );
    lines.push(
      '─────────────────────────────────────────────────────────────────────────────────────────'
    );

    for (const campaign of snapshot.campaigns) {
      const name = campaign.campaign_name.substring(0, 30).padEnd(30);
      const product = (campaign.product_slug || 'unknown').substring(0, 15).padEnd(15);
      const impressions = campaign.impressions.toString().padStart(6);
      const clicks = campaign.clicks.toString().padStart(6);
      const conversions = campaign.conversions.toFixed(0).padStart(5);
      const cac = `$${campaign.cac_aud.toFixed(0)}`.padStart(6);
      const status = campaign.campaign_status.substring(0, 10);

      lines.push(`${name} | ${product} | ${impressions} | ${clicks} | ${conversions} | ${cac} | ${status}`);
    }

    lines.push('\n');

    // Top performing keywords
    lines.push('🔑 TOP 10 KEYWORDS (by conversions)\n');
    lines.push('Keyword                        | Campaign                | Impr.  | Clicks | Conv. | CAC');
    lines.push(
      '─────────────────────────────────────────────────────────────────────────────────────────'
    );

    const topKeywords = [...snapshot.keywords]
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10);

    for (const keyword of topKeywords) {
      const text = keyword.keyword_text.substring(0, 30).padEnd(30);
      const campaign = keyword.campaign_name.substring(0, 23).padEnd(23);
      const impressions = keyword.impressions.toString().padStart(6);
      const clicks = keyword.clicks.toString().padStart(6);
      const conversions = keyword.conversions.toFixed(0).padStart(5);
      const cac = `$${keyword.cac_aud.toFixed(0)}`.padStart(5);

      lines.push(`${text} | ${campaign} | ${impressions} | ${clicks} | ${conversions} | ${cac}`);
    }

    lines.push('\n');

    // Top performing ads
    lines.push('📝 TOP 10 ADS (by CTR)\n');
    lines.push('Headlines (first 3)            | Campaign                | Impr.  | CTR    | Conv.');
    lines.push(
      '─────────────────────────────────────────────────────────────────────────────────────────'
    );

    const topAds = [...snapshot.adCopy]
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 10);

    for (const ad of topAds) {
      const headlines = ad.headlines.slice(0, 3).join(' | ').substring(0, 30).padEnd(30);
      const campaign = ad.campaign_name.substring(0, 23).padEnd(23);
      const impressions = ad.impressions.toString().padStart(6);
      const ctr = `${ad.ctr.toFixed(1)}%`.padStart(6);
      const conversions = ad.conversions.toFixed(0).padStart(5);

      lines.push(`${headlines} | ${campaign} | ${impressions} | ${ctr} | ${conversions}`);
    }

    lines.push('\n═══════════════════════════════════════════════════════════\n');

    return lines.join('\n');
  }

  /**
   * Export summary report to text file
   */
  exportSummaryReport(snapshot: WeeklySnapshot): string {
    const report = this.generateSummaryReport(snapshot);
    const filename = `${snapshot.metadata.week_start}_${snapshot.metadata.week_end}_summary.txt`;
    const filepath = path.join(this.snapshotDir, filename);

    fs.writeFileSync(filepath, report, 'utf8');

    return filepath;
  }
}
