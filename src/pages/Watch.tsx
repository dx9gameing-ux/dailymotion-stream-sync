import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Video } from '@/integrations/supabase/custom-types';
import Navbar from '@/components/Navbar';
import VideoCard from '@/components/VideoCard';
import { ChevronRight, Play, Clock, Calendar, ArrowLeft } from 'lucide-react';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

const Watch: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [nextEpisode, setNextEpisode] = useState<Video | null>(null);
  const [related, setRelated] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    supabase
      .from('videos')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setLoading(false);
          return;
        }
        setVideo(data);

        // Increment view count
        supabase.from('videos').update({ view_count: (data.view_count || 0) + 1 }).eq('id', data.id);

        // Fetch next episode if this is part of a series
        if (data.series_name && data.episode_number !== null) {
          const { data: next } = await supabase
            .from('videos')
            .select('*')
            .eq('series_name', data.series_name)
            .eq('season_number', data.season_number)
            .eq('episode_number', (data.episode_number || 0) + 1)
            .single();
          setNextEpisode(next || null);
        }

        // Related / same series
        const { data: rel } = await supabase
          .from('videos')
          .select('*')
          .neq('id', data.id)
          .eq(data.series_name ? 'series_name' : 'id', data.series_name || data.id)
          .order('episode_number', { ascending: true })
          .limit(12);

        if (!rel || rel.length < 4) {
          // Fall back to latest videos
          const { data: latest } = await supabase
            .from('videos')
            .select('*')
            .neq('id', data.id)
            .order('created_at', { ascending: false })
            .limit(8);
          setRelated(latest || []);
        } else {
          setRelated(rel);
        }

        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <p className="text-muted-foreground text-lg">Video not found.</p>
          <Link to="/" className="text-primary hover:underline mt-4 inline-block">← Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main player column */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/50 mb-4">
              <iframe
                src={`https://www.dailymotion.com/embed/video/${video.video_id}?autoplay=1&queue-autoplay-next=1`}
                title={video.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>

            {/* Video Info */}
            <div className="mb-6">
              {video.series_name && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-primary text-sm font-semibold">{video.series_name}</span>
                  {video.season_number && video.episode_number && (
                    <>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">
                        S{video.season_number.toString().padStart(2, '0')}E{video.episode_number.toString().padStart(2, '0')}
                      </span>
                    </>
                  )}
                </div>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{video.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {video.duration && video.duration > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {formatDuration(video.duration)}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(video.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                {video.view_count && video.view_count > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Play className="w-4 h-4" />
                    {video.view_count.toLocaleString()} views
                  </span>
                )}
              </div>
              {video.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">{video.description}</p>
              )}
            </div>

            {/* Next Episode */}
            {nextEpisode && (
              <div className="bg-card border border-border rounded-xl p-4 mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Next Episode</p>
                <Link
                  to={`/watch/${nextEpisode.slug}`}
                  className="flex gap-4 group"
                >
                  <div className="w-32 shrink-0 aspect-video rounded-lg overflow-hidden bg-muted">
                    {nextEpisode.thumbnail && (
                      <img src={nextEpisode.thumbnail} alt={nextEpisode.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-medium mb-1">
                      S{nextEpisode.season_number?.toString().padStart(2, '0')}E{nextEpisode.episode_number?.toString().padStart(2, '0')}
                    </p>
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {nextEpisode.title}
                    </p>
                  </div>
                  <div className="shrink-0 self-center">
                    <div className="bg-primary rounded-full p-2">
                      <Play className="w-4 h-4 text-primary-foreground fill-current" />
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar - Related Videos */}
          <div>
            <h3 className="text-base font-semibold text-foreground mb-4">
              {video.series_name ? `More from ${video.series_name}` : 'More Videos'}
            </h3>
            <div className="space-y-3">
              {related.map((v) => (
                <Link
                  key={v.id}
                  to={`/watch/${v.slug}`}
                  className="flex gap-3 group hover:bg-card rounded-lg p-2 -mx-2 transition-colors"
                >
                  <div className="w-28 shrink-0 aspect-video rounded-md overflow-hidden bg-muted">
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {v.episode_number && (
                      <p className="text-xs text-primary font-medium">
                        S{v.season_number?.toString().padStart(2, '0')}E{v.episode_number.toString().padStart(2, '0')}
                      </p>
                    )}
                    <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {v.title}
                    </p>
                    {v.duration && v.duration > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(v.duration)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Watch;
