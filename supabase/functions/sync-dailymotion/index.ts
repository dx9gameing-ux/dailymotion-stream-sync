import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateSlug(title: string, videoId: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `${base}-${videoId}`;
}

function detectSeries(title: string): { seriesName: string | null; season: number | null; episode: number | null } {
  // Match patterns like S01E01, S1E1, Season 1 Episode 1
  const patterns = [
    /^(.+?)\s+[Ss](\d+)[Ee](\d+)/,
    /^(.+?)\s+Season\s+(\d+)\s+Episode\s+(\d+)/i,
    /^(.+?)\s+(\d+)x(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return {
        seriesName: match[1].trim(),
        season: parseInt(match[2]),
        episode: parseInt(match[3]),
      };
    }
  }
  return { seriesName: null, season: null, episode: null };
}

async function getDailymotionToken(): Promise<string> {
  const key = Deno.env.get('DAILYMOTION_KEY')!;
  const secret = Deno.env.get('DAILYMOTION_SECRET')!;

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: key,
    client_secret: secret,
    scope: 'read',
  });

  const res = await fetch('https://api.dailymotion.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dailymotion auth failed: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const token = await getDailymotionToken();

    // Fetch all videos from the authenticated user's account
    let page = 1;
    let allVideos: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const apiUrl = `https://api.dailymotion.com/me/videos?fields=id,title,thumbnail_url,duration,created_time,description&limit=100&page=${page}&access_token=${token}`;
      const res = await fetch(apiUrl);

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Dailymotion API error: ${err}`);
      }

      const data = await res.json();
      allVideos = allVideos.concat(data.list || []);
      hasMore = data.has_more || false;
      page++;

      if (page > 10) break; // Safety limit
    }

    // Get existing video IDs from DB
    const { data: existing } = await supabase
      .from('videos')
      .select('video_id');

    const existingIds = new Set((existing || []).map((v: any) => v.video_id));

    // Filter new videos
    const newVideos = allVideos.filter((v: any) => !existingIds.has(v.id));

    if (newVideos.length > 0) {
      const toInsert = newVideos.map((v: any) => {
        const { seriesName, season, episode } = detectSeries(v.title);
        return {
          video_id: v.id,
          title: v.title,
          thumbnail: v.thumbnail_url,
          duration: v.duration || 0,
          created_at: new Date((v.created_time || Date.now() / 1000) * 1000).toISOString(),
          slug: generateSlug(v.title, v.id),
          description: v.description || null,
          series_name: seriesName,
          season_number: season,
          episode_number: episode,
        };
      });

      const { error: insertError } = await supabase
        .from('videos')
        .insert(toInsert);

      if (insertError) throw insertError;
    }

    // Log the sync
    await supabase.from('sync_logs').insert({
      videos_added: newVideos.length,
      status: 'success',
    });

    return new Response(
      JSON.stringify({ success: true, videos_added: newVideos.length, total_fetched: allVideos.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    await supabase.from('sync_logs').insert({
      videos_added: 0,
      status: 'error',
      error_message: err.message,
    });

    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
