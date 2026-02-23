import CameraDetailClient from './CameraDetailClient';

export async function generateStaticParams() {
  return [{ id: ['index'] }];
}

export default function CameraDetailPage({ params }: { params: Promise<{ id: string[] }> }) {
  return <CameraDetailClient params={params} />;
}
