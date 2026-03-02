import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Video, SyncLog } from '@/integrations/supabase/custom-types';
import Navbar from '@/components/Navbar';
import { RefreshCw, Trash2, Edit2, Check, X, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';

const ADMIN_PASS = 'admin123'; // Simple protection — replace with proper auth if needed

const Admin: React.FC = () => {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [tab, setTab] = useState<'videos' | 'logs'>('videos');
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    const [videosRes, logsRes] = await Promise.all([
      supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('sync_logs').select('*').order('synced_at', { ascending: false }).limit(20),
    ]);
    setVideos(videosRes.data || []);
    setLogs(logsRes.data || []);
  }, []);

  useEffect(() => {
    if (authed) fetchData();
  }, [authed, fetchData]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-dailymotion');
      if (error) throw error;
      setSyncResult({ success: true, message: `Sync complete! ${data.videos_added} new video(s) added.` });
      fetchData();
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    const { error } = await supabase.functions.invoke('delete-video', { body: { id } });
    if (!error) setVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleEdit = (video: Video) => {
    setEditingId(video.id);
    setEditTitle(video.title);
  };

  const handleSaveEdit = async (id: string) => {
    const { error } = await supabase.functions.invoke('update-video', { body: { id, title: editTitle } });
    if (!error) {
      setVideos(prev => prev.map(v => v.id === id ? { ...v, title: editTitle } : v));
      setEditingId(null);
    }
  };

  const filtered = videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-primary rounded-md p-1.5">
              <Play className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
            <h2 className="text-xl font-bold">Admin Access</h2>
          </div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && password === ADMIN_PASS && setAuthed(true)}
            className="w-full bg-secondary border border-border rounded-lg px-4 py-2.5 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          />
          <button
            onClick={() => password === ADMIN_PASS ? setAuthed(true) : alert('Wrong password')}
            className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 font-semibold hover:bg-primary/90 transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">{videos.length} videos in database</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Dailymotion'}
          </button>
        </div>

        {/* Sync result */}
        {syncResult && (
          <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${syncResult.success ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-destructive/10 border border-destructive/30 text-destructive'}`}>
            {syncResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="text-sm">{syncResult.message}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit mb-6">
          {(['videos', 'logs'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'videos' && (
          <>
            <input
              placeholder="Search videos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            />
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thumbnail</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Series</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(video => (
                    <tr key={video.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-16 aspect-video rounded overflow-hidden bg-muted shrink-0">
                          {video.thumbnail && <img src={video.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingId === video.id ? (
                          <input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full bg-secondary border border-primary rounded px-2 py-1 text-sm text-foreground focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm text-foreground font-medium line-clamp-2">{video.title}</span>
                        )}
                        <span className="text-xs text-muted-foreground">{video.video_id}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {video.series_name ? `${video.series_name} S${video.season_number}E${video.episode_number}` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === video.id ? (
                            <>
                              <button onClick={() => handleSaveEdit(video.id)} className="p-1.5 text-accent hover:bg-accent/10 rounded transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleEdit(video)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(video.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No videos found.</div>
              )}
            </div>
          </>
        )}

        {tab === 'logs' && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Videos Added</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(log.synced_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                        {log.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground font-medium">{log.videos_added ?? 0}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.error_message || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No sync logs yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
