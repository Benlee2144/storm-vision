import cameraData from '@/data/cameras.json';
import CameraDetailClient from './CameraDetailClient';

export function generateStaticParams() {
  return (cameraData as Array<{ id: string }>).map((c) => ({ id: c.id }));
}

export default function CameraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <CameraDetailClient params={params} />;
}
