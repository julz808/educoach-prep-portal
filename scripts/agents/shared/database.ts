/**
 * Database Client for Marketing Agents
 *
 * Provides type-safe access to all agent-related database tables
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

export interface CampaignPerformance {
  date: string;
  campaign_id: string;
  campaign_name: string;
  product_slug: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversion_value_micros: number;
}

export interface AgentAction {
  action_type: string;
  campaign_id?: string;
  product_slug?: string;
  details: Record<string, any>;
  requires_approval?: boolean;
  execution_status?: string;
}

export interface SearchTerm {
  date: string;
  campaign_id: string;
  product_slug: string;
  search_term: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  flagged_as_negative?: boolean;
  flagged_reason?: string;
  is_high_performer?: boolean;
}

export interface TestCalendar {
  product_slug: string;
  product_name: string;
  test_date_primary: string;
  test_date_secondary?: string;
  intensity_jan: number;
  intensity_feb: number;
  intensity_mar: number;
  intensity_apr: number;
  intensity_may: number;
  intensity_jun: number;
  intensity_jul: number;
  intensity_aug: number;
  intensity_sep: number;
  intensity_oct: number;
  intensity_nov: number;
  intensity_dec: number;
  base_daily_budget_aud: number;
  min_daily_budget_aud: number;
  max_daily_budget_aud: number;
  target_cpa_aud: number;
  pause_cpa_aud: number;
}

export class Database {
  public client: SupabaseClient;  // Made public for direct access

  constructor() {
    this.client = createClient(supabaseUrl, supabaseServiceKey);
  }

  // Expose the raw client for modules that need direct Supabase access
  getClient(): SupabaseClient {
    return this.client;
  }

  // ==========================================
  // CAMPAIGN PERFORMANCE
  // ==========================================

  async saveCampaignPerformance(
    data: CampaignPerformance | CampaignPerformance[]
  ): Promise<void> {
    const records = Array.isArray(data) ? data : [data];

    const { error } = await this.client
      .from('google_ads_campaign_performance')
      .upsert(records, {
        onConflict: 'date,campaign_id',
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(
        `Failed to save campaign performance: ${error.message}`
      );
    }
  }

  async getCampaignPerformance(
    productSlug: string,
    days: number = 7
  ): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from('google_ads_campaign_performance')
      .select('*')
      .eq('product_slug', productSlug)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      throw new Error(
        `Failed to get campaign performance: ${error.message}`
      );
    }

    return data || [];
  }

  // ==========================================
  // AGENT ACTIONS
  // ==========================================

  async logAgentAction(action: AgentAction): Promise<number> {
    const { data, error } = await this.client
      .from('google_ads_agent_actions')
      .insert({
        ...action,
        execution_status: action.execution_status || 'pending',
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to log agent action: ${error.message}`);
    }

    return data.id;
  }

  async updateActionStatus(
    actionId: number,
    status: string,
    error?: string
  ): Promise<void> {
    const updates: any = {
      execution_status: status,
      executed_at: new Date().toISOString(),
    };

    if (error) {
      updates.execution_error = error;
    }

    const { error: updateError } = await this.client
      .from('google_ads_agent_actions')
      .update(updates)
      .eq('id', actionId);

    if (updateError) {
      throw new Error(
        `Failed to update action status: ${updateError.message}`
      );
    }
  }

  async getPendingApprovals(): Promise<any[]> {
    const { data, error } = await this.client
      .from('google_ads_agent_actions')
      .select('*')
      .eq('requires_approval', true)
      .is('approved_at', null)
      .is('rejected_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get pending approvals: ${error.message}`);
    }

    return data || [];
  }

  // ==========================================
  // SEARCH TERMS
  // ==========================================

  async saveSearchTerms(
    terms: SearchTerm | SearchTerm[]
  ): Promise<void> {
    const records = Array.isArray(terms) ? terms : [terms];

    const { error } = await this.client
      .from('google_ads_search_terms')
      .upsert(records, {
        onConflict: 'date,campaign_id,search_term',
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to save search terms: ${error.message}`);
    }
  }

  async getSearchTerms(
    productSlug?: string,
    days: number = 7
  ): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = this.client
      .from('google_ads_search_terms')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0]);

    if (productSlug) {
      query = query.eq('product_slug', productSlug);
    }

    const { data, error } = await query.order('date', {
      ascending: false,
    });

    if (error) {
      throw new Error(`Failed to get search terms: ${error.message}`);
    }

    return data || [];
  }

  // ==========================================
  // TEST CALENDAR
  // ==========================================

  async getTestCalendar(
    productSlug?: string
  ): Promise<TestCalendar[]> {
    let query = this.client.from('test_calendar').select('*');

    if (productSlug) {
      query = query.eq('product_slug', productSlug);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get test calendar: ${error.message}`);
    }

    return data || [];
  }

  // ==========================================
  // WEEKLY SUMMARY
  // ==========================================

  async saveWeeklySummary(summary: {
    week_start_date: string;
    total_budget_changes: number;
    total_bidding_changes: number;
    total_negative_keywords_flagged: number;
    total_campaigns_paused: number;
    performance_summary: Record<string, any>;
    dry_run: boolean;
    execution_duration_seconds?: number;
    errors?: any[];
  }): Promise<void> {
    const { error } = await this.client
      .from('google_ads_weekly_summary')
      .insert(summary);

    if (error) {
      throw new Error(`Failed to save weekly summary: ${error.message}`);
    }
  }

  // ==========================================
  // COORDINATION EVENTS
  // ==========================================

  async sendCoordinationEvent(event: {
    event_type: string;
    source_agent: string;
    target_agent?: string;
    product_slug?: string;
    event_data: Record<string, any>;
  }): Promise<void> {
    const { error } = await this.client
      .from('agent_coordination_events')
      .insert(event);

    if (error) {
      throw new Error(
        `Failed to send coordination event: ${error.message}`
      );
    }
  }
}

export const db = new Database();
