# E-Hub Services Deployment Guide

This project is a React (Vite) application with a Convex backend and Clerk authentication.

## 1. Backend Deployment (Convex)

1.  **Initialize Production**: Run the following command in your terminal:
    ```bash
    npx convex deploy
    ```
    This will deploy your schema and functions to a production Convex deployment. It will provide you with a **Production Convex URL**.

2.  **Environment Variables**: Go to the [Convex Dashboard](https://dashboard.convex.dev), select your production project, and go to **Settings > Environment Variables**. Add the following:
    *   `RAZORPAY_KEY_ID`: Your production Razorpay Key ID.
    *   `RAZORPAY_KEY_SECRET`: Your production Razorpay Key Secret.

3.  **Auth Configuration**: In the Convex Dashboard, ensure your Auth provider is configured correctly for production. Check `convex/auth.config.ts` - you may need to update the domain if you are using a production Clerk instance.

## 2. Frontend Deployment (Vercel)

1.  **Push to Git**: Ensure your code is pushed to a GitHub/GitLab/Bitbucket repository.
2.  **Import to Vercel**: Go to [Vercel](https://vercel.com/new) and import your repository.
3.  **Configure Build**:
    *   **Framework Preset**: Vite
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
4.  **Environment Variables**: Add the following variables in the Vercel dashboard:
    *   `VITE_CONVEX_URL`: The production URL you got from `npx convex deploy`.
    *   `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk production publishable key.
    *   `CLERK_SECRET_KEY`: Your Clerk production secret key.

## 3. Auth Management (Clerk)

1.  **Production Instance**: Ensure you are using your Clerk production instance keys.
2.  **Redirect URLs**: In the Clerk Dashboard, go to **Configure > Paths** and set your production application URL.
3.  **Allowed Regions**: If applicable, configure allowed origins to include your Vercel domain.

## Project Structure Notes

*   `vercel.json`: Handles client-side routing for the Single Page Application.
*   `convex/`: Contains backend logic and schema.
*   `src/`: Contains React frontend components.
