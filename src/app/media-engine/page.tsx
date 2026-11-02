import React from 'react';
import { Metadata } from 'next';
import MediaEngineView from '@/components/media-engine/MediaEngineView';

export const metadata: Metadata = {
  title: 'Media Engine Console | Devportal',
  description:
    'Real-time image and video processing pipeline, Celery background queues, variant storage, and recycling console.',
};

export default function MediaEnginePage() {
  return <MediaEngineView />;
}

