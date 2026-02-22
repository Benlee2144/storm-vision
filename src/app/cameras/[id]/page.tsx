import CameraDetailClient from './CameraDetailClient';

// With 18K+ cameras we can't pre-render all detail pages.
// Generate a placeholder page; real camera data is fetched client-side.
export async function generateStaticParams() {
  return [{ id: 'index' }];
}

export default function CameraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <CameraDetailClient params={params} />;
}
