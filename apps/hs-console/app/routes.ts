import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  index('routes/openspec.tsx'),
  route('skills', 'routes/skills.tsx')
] satisfies RouteConfig;
