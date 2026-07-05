export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/accounts/:path*',
    '/categories/:path*',
    '/transactions/:path*',
    '/budgets/:path*',
    '/goals/:path*',
    '/bills/:path*',
  ],
};
