import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Video } from '@/integrations/supabase/custom-types';
import Navbar from '@/components/Navbar';
import VideoCard from '@/components/VideoCard';
import { ChevronDown, ChevronRight, Tv2 } from 'lucide-react';

interface SeriesGroup {
  name: string;
  seasons: Record<number, Video[]>;
}

const Series: React.FC = () => {
  const [series, setSeries] = useState<SeriesGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase
      .from('videos')
      .select('*')
      .not('series_name', 'is', null)
      .order('series_name')
      .order('season_number')
      .order('episode_number')
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }

        const grouped: Record<string, SeriesGroup> = {};
        data.forEach((v) => {
          const name = v.series_name!;
          if (!grouped[name]) grouped[name] = { name, seasons: {} };
          const season = v.season_number || 1;
          if (!grouped[name].seasons[season]) grouped[name].seasons[season] = [];
          grouped[name].seasons[season].push(v);
        });

        const result = Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
        setSeries(result);

        // Auto-expand first series
        if (result.length > 0) setExpanded({ [result[0].name]: true });
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center gap-2 mb-8">
          <Tv2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Series</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <Tv2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No series detected yet. Upload videos with naming like "ShowName S01E01".</p>
          </div>
        ) : (
          <div className="space-y-6">
            {series.map((s) => (
              <div key={s.name} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [s.name]: !prev[s.name] }))}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-primary rounded-full" />
                    <h2 className="text-lg font-bold text-foreground">{s.name}</h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                      {Object.values(s.seasons).flat().length} episodes
                    </span>
                  </div>
                  {expanded[s.name] ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                </button>

                {expanded[s.name] && (
                  <div className="px-6 pb-6 space-y-6 border-t border-border pt-4">
                    {Object.entries(s.seasons).map(([season, episodes]) => (
                      <div key={season}>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Season {season}</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {episodes.map(ep => <VideoCard key={ep.id} video={ep} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Series;
