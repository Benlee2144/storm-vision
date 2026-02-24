import { US_STATES } from '@/lib/constants/states';
import StateCamerasClient from './StateCamerasClient';

export function generateStaticParams() {
  return US_STATES.map((s) => ({ state: s.code.toLowerCase() }));
}

export default async function StateCamerasPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  return <StateCamerasClient stateCode={state} />;
}
