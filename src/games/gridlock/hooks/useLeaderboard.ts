import { useState, useEffect, useCallback } from 'react';
import type { LeaderboardEntry } from '../types';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

const TABLE = 'gridlock_scores';
const TOP_N = 20;

function isConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function supabaseFetch(path: string, options?: RequestInit) {
  const key = SUPABASE_ANON_KEY!;
  // New sb_publishable_ keys are not JWTs and cannot be used as Bearer tokens.
  // Legacy eyJ... keys work in both headers.
  const isLegacyJwt = key.startsWith('eyJ');

  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: key,
      ...(isLegacyJwt ? { Authorization: `Bearer ${key}` } : {}),
      'Content-Type': 'application/json',
      ...(options?.method === 'POST' ? { Prefer: 'return=representation' } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${body}`);
  }
  return res.json();
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const configured = isConfigured();

  const fetchLeaderboard = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const data = await supabaseFetch(
        `/${TABLE}?select=id,player_name,score,level,lines,created_at&order=score.desc&limit=${TOP_N}`,
      );
      setEntries(data);
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
      setError('Could not load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const submitScore = useCallback(
    async (playerName: string, score: number, level: number, lines: number) => {
      if (!configured) {
        console.error('Supabase not configured. PUBLIC_SUPABASE_URL:', SUPABASE_URL, 'PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '[set]' : '[missing]');
        setError('Leaderboard not configured');
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await supabaseFetch(`/${TABLE}`, {
          method: 'POST',
          body: JSON.stringify({ player_name: playerName, score, level, lines }),
        });
        setSubmitted(true);
        await fetchLeaderboard();
      } catch (e) {
        console.error('Failed to submit score:', e);
        setError(e instanceof Error ? e.message : 'Failed to submit score');
      } finally {
        setSubmitting(false);
      }
    },
    [configured, fetchLeaderboard],
  );

  const resetSubmission = useCallback(() => {
    setSubmitted(false);
    setError(null);
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    entries,
    loading,
    submitting,
    submitted,
    error,
    fetchLeaderboard,
    submitScore,
    resetSubmission,
    isConfigured: configured,
  };
}
