import type { MetaFunction } from 'react-router';
import DashboardApp from '../dashboard/DashboardApp';

export const meta: MetaFunction = () => {
  return [
    { title: 'OpenSpec Dashboard' },
    { name: 'description', content: 'OpenSpec dashboard for hs-cli' }
  ];
};

export default function Home() {
  return <DashboardApp />;
}
