"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ArtisanTrackerProps {
  jobId: string;
  onComplete?: (result: any) => void;
}

type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface LogEntry {
  timestamp: string;
  message: string;
}

export default function ArtisanTracker({ jobId, onComplete }: ArtisanTrackerProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<JobStatus>('queued');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initial fetch
    const fetchInitialJob = async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('progress_logs, status, result_payload')
        .eq('id', jobId)
        .single();

      if (data) {
        setLogs(data.progress_logs || []);
        setStatus(data.status as JobStatus);
        if (data.status === 'completed' && onComplete) {
          onComplete(data.result_payload);
        }
      }
    };

    fetchInitialJob();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`job-tracker-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          const newData = payload.new;
          setLogs(newData.progress_logs || []);
          setStatus(newData.status as JobStatus);
          setIsConnected(true);

          if (newData.status === 'completed') {
            setIsConnected(false);
            supabase.removeChannel(channel);
            if (onComplete) {
              onComplete(newData.result_payload);
            }
          } else if (newData.status === 'failed') {
            setIsConnected(false);
          }
        }
      )
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          setIsConnected(true);
        } else if (subscriptionStatus === 'CHANNEL_ERROR') {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, onComplete]);

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-500 animate-pulse';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Synthesizing...';
      case 'completed':
        return 'Complete';
      case 'failed':
        return 'Failed';
      default:
        return 'Queued';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono shadow-2xl border border-green-500/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <span className="text-sm uppercase tracking-widest text-gray-400">
              Artisan Synthesis Engine
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isConnected ? 'text-green-500' : 'text-gray-500'}`}>
              {isConnected ? '● Live' : '○ Connecting...'}
            </span>
            <span className="text-xs text-gray-500 uppercase">{getStatusText()}</span>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="space-y-2 text-sm max-h-80 overflow-y-auto min-h-[200px] bg-black/30 p-4 rounded">
          {logs.length === 0 && status === 'queued' && (
            <p className="text-gray-500 italic">Awaiting queue assignment...</p>
          )}
          
          {logs.map((log, index) => {
            // Parse timestamp and message
            const match = log.match(/\[(\d{2}:\d{2}:\d{2})\] (.+)/);
            const timestamp = match ? match[1] : '';
            const message = match ? match[2] : log;

            return (
              <div 
                key={index} 
                className="flex gap-3 opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="text-gray-600 shrink-0">
                  {timestamp ? `[${timestamp}]` : '>'}
                </span>
                <span className={message.includes('✓') ? 'text-green-300' : ''}>
                  {message}
                </span>
              </div>
            );
          })}

          {status === 'processing' && (
            <div className="flex gap-3">
              <span className="text-gray-600">&gt;</span>
              <span className="animate-pulse text-green-400">_</span>
            </div>
          )}

          {status === 'failed' && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-300">
              <p className="font-semibold">Processing failed</p>
              <p className="text-sm mt-1">Check the logs above for details. The job can be retried.</p>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        {status === 'processing' && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ 
                    width: `${Math.min(logs.length * 20, 100)}%`,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                />
              </div>
              <span>{Math.min(logs.length * 20, 100)}%</span>
            </div>
          </div>
        )}

        {/* Completion Actions */}
        {status === 'completed' && (
          <div className="mt-4 pt-4 border-t border-gray-700 flex gap-3">
            <button
              onClick={() => onComplete && onComplete(null)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
            >
              View Results
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
