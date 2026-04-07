## Shopflow Frontend

Next.js frontend for Shopflow. It can run locally against the backend API or be deployed separately from the backend.

## Local Development

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Run the frontend on port `3001` so it does not conflict with the backend default port:

```bash
pnpm dev -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

If you are running the backend locally, make sure `apps/backend/.env` allows the frontend origin:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_BASE_URL=http://localhost:3001
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Separate Deployment

The frontend can be deployed separately from the backend.

Set the frontend environment variable to your deployed API:

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

The backend should then allow the deployed frontend origin with:

```env
CORS_ORIGINS=https://app.yourdomain.com
FRONTEND_BASE_URL=https://app.yourdomain.com
```

Build commands:

```bash
pnpm build
pnpm start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
