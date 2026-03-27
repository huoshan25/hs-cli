import type { MetaFunction } from 'react-router';
import DashboardApp from '../dashboard/DashboardApp';
import { ConsoleNav } from '../components/ConsoleNav';

export const meta: MetaFunction = () => {
  return [
    { title: 'HS Console - OpenSpec' },
    { name: 'description', content: 'HS Console OpenSpec module' }
  ];
};

export default function Home() {
  return (
    <>
      <ConsoleNav />
      <DashboardApp />
    </>
  );
}
