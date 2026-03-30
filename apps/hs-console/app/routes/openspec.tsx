import type { MetaFunction } from 'react-router';
import DashboardApp from '../dashboard/DashboardApp';

export const meta: MetaFunction = () => {
  return [
    { title: 'HS Console - OpenSpec' },
    { name: 'description', content: 'HS Console OpenSpec module' }
  ];
};

export default function Home() {
  return <DashboardApp />;
}
