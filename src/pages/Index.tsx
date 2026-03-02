import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Video } from '@/integrations/supabase/custom-types';
import VideoCard from '@/components/VideoCard';
import Navbar from '@/components/Navbar';
import { Play, RefreshCw, TrendingUp } from 'lucide-react';

const ITEMS_PER_PAGE = 24;

const Index: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [featured, setFeatured] = useState<Video | null>(null);

  const fetchVideos = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('videos')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((p - 1) * ITEMS_PER_PAGE, p * ITEMS_PER_PAGE - 1);

      if (q) {
        queryBuilder = queryBuilder.ilike('title', `%${q}%`);
      }

      const { data, count, error } = await queryBuilder;
      if (error) throw error;
      setVideos(data || []);
      setTotal(count || 0);

      if (p === 1 && !q && data && data.length > 0) {
        setFeatured(data[0]);
      }
    } catch (err) {
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchVideos(query, 1);
  }, [query, fetchVideos]);

  const handleSearch = (q: string) => {
    setSearchParams(q ? { q } : {});
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} searchValue={query} />

      {/* Hero Section - only on first page without search */}
      {featured && !query && page === 1 && (
        <div className="relative pt-16 h-[520px] md:h-[600px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${featured.thumbnail})` }}
          />
          <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
          <div className="relative z-10 flex flex-col justify-end h-full pb-16 px-6 md:px-12 max-w-7xl mx-auto">
            {featured.series_name && (
              <span className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">
                {featured.series_name}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-3 max-w-xl leading-tight drop-shadow-lg">
              {featured.title}
            </h1>
            {featured.description && (
              <p className="text-muted-foreground text-sm md:text-base max-w-lg mb-6 line-clamp-2">
                {featured.description}
              </p>
            )}
            <div className="flex gap-3">
              <a
                href={`/watch/${featured.slug}`}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 ${!featured || query ? 'pt-24' : 'pt-8'}`}>
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {query ? (
              <h2 className="text-xl font-bold text-foreground">
                Results for "{query}" <span className="text-muted-foreground text-base font-normal">({total})</span>
              </h2>
            ) : (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Latest Videos</h2>
              </div>
            )}
          </div>
          {loading && <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />}
        </div>

        {/* Video Grid */}
        {!loading && videos.length === 0 ? (
          <div className="text-center py-24">
            <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-muted-foreground text-lg">
              {query ? 'No videos found for your search.' : 'No videos yet. Sync your Dailymotion account in Admin.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {loading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-lg overflow-hidden">
                    <div className="aspect-video bg-muted animate-pulse rounded-t-lg" />
                    <div className="p-3 bg-card rounded-b-lg space-y-2">
                      <div className="h-3 bg-muted animate-pulse rounded w-full" />
                      <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                    </div>
                  </div>
                ))
              : videos.map((video) => <VideoCard key={video.id} video={video} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); fetchVideos(query, page - 1); }}
              disabled={page === 1}
              className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); fetchVideos(query, page + 1); }}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
