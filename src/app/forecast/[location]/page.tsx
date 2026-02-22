import ForecastClient from './ForecastClient';

export function generateStaticParams() {
  // Common cities - more can be added
  return [
    { location: 'new-york-ny' },
    { location: 'los-angeles-ca' },
    { location: 'chicago-il' },
    { location: 'houston-tx' },
    { location: 'miami-fl' },
    { location: 'denver-co' },
    { location: 'seattle-wa' },
    { location: 'atlanta-ga' },
    { location: 'phoenix-az' },
    { location: 'dallas-tx' },
  ];
}

export default function ForecastLocationPage({ params }: { params: Promise<{ location: string }> }) {
  return <ForecastClient params={params} />;
}
