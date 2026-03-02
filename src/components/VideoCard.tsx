import React from 'react';
import { Play, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Video } from '@/integrations/supabase/custom-types';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  return (
    <Link
      to={`/watch/${video.slug}`}
      className="group video-card-shine relative block rounded-lg overflow-hidden bg-card border border-border transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="bg-primary rounded-full p-3 shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-200">
            <Play className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
        </div>
        {/* Duration badge */}
        {video.duration && video.duration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-foreground text-xs px-1.5 py-0.5 rounded font-medium">
            {formatDuration(video.duration)}
          </div>
        )}
        {/* Episode badge */}
        {video.series_name && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-semibold">
            S{video.season_number?.toString().padStart(2, '0')}E{video.episode_number?.toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {video.duration && video.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(video.duration)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(video.created_at)}
          </span>
        </div>
        {video.series_name && (
          <p className="text-xs text-primary mt-1 font-medium">{video.series_name}</p>
        )}
      </div>
    </Link>
  );
};

export default VideoCard;
