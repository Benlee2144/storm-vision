import { US_STATES } from '@/lib/constants/states';
import StateCamerasClient from './StateCamerasClient';

export function generateStaticParams() {
  return US_STATES.map((s) => ({ state: s.code.toLowerCase() }));
}

export default function StateCamerasPage({ params }: { params: Promise<{ state: string }> }) {
  return <StateCamerasClient params={params} />;
}
