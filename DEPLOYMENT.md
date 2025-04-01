# Deployment Guide

This document provides detailed instructions for deploying the Color Trading Platform to various hosting platforms.

## Pre-Deployment Steps

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Prepare the Database**
   ```bash
   # Run the migration script
   node --loader ts-node/esm scripts/deploy-db.js
   
   # Or manually apply the schema changes
   npm run db:push
   
   # Initialize default data (admin user and subscriptions)
   node --loader ts-node/esm scripts/init-data.js
   ```

## Environment Variables

Ensure the following environment variables are set on your hosting platform:

```
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
```

## 1. Vercel Deployment

Vercel is a cloud platform for frontend frameworks and static sites, built to integrate with your headless content, commerce, or database.

1. **Connect your Git repository to Vercel**
   - Create an account on [Vercel](https://vercel.com)
   - Connect your GitHub, GitLab, or Bitbucket repository

2. **Configure build settings**
   - Build Command: `npm run build`
   - Output Directory: `client/dist`
   - Install Command: `npm install`

3. **Set environment variables**
   - Go to Settings > Environment Variables
   - Add the required environment variables listed above

4. **Deploy**
   - Click "Deploy" button in the Vercel dashboard

## 2. Netlify Deployment

Netlify is a web developer platform that multiplies your productivity in building and maintaining websites and web apps.

1. **Connect your Git repository to Netlify**
   - Create an account on [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub, GitLab, or Bitbucket repository

2. **Configure build settings**
   - Build Command: `npm run build`
   - Publish Directory: `client/dist`

3. **Set environment variables**
   - Go to Site Settings > Build & Deploy > Environment
   - Add the required environment variables listed above

4. **Deploy**
   - Netlify will automatically deploy your site when you push to your repository

## 3. Render Deployment

Render is a unified cloud to build and run all your apps and websites with free TLS certificates, global CDN, private networks and auto deploys from Git.

1. **Create a new Web Service on Render**
   - Create an account on [Render](https://render.com)
   - Click "New" and select "Web Service"
   - Connect your GitHub or GitLab repository

2. **Configure settings**
   - Environment: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Set environment variables**
   - Go to Environment tab
   - Add the required environment variables listed above

4. **Deploy**
   - Click "Create Web Service" button

## 4. Docker Deployment

For container-based deployments, you can use the provided Dockerfile.

1. **Build the Docker image**
   ```bash
   docker build -t color-trading-platform .
   ```

2. **Run the container**
   ```bash
   docker run -p 5000:5000 --env-file .env color-trading-platform
   ```

## Running Database Migrations

When updating the database schema for deployment, run the database migration script:

```bash
node --loader ts-node/esm scripts/deploy-db.js
```

This script will:
1. Add the required columns to the `user_subscriptions` table
2. Add the level and withdrawal_wait_days columns to the `subscriptions` table

## Troubleshooting

### Database Connection Issues
- Verify your DATABASE_URL is correct
- Ensure your database server allows connections from your deployment platform
- Check firewall rules and network access

### Build Failures
- Check the build logs for specific errors
- Ensure all dependencies are correctly installed
- Verify that the build command is correctly specified

### Runtime Errors
- Check application logs on your hosting platform
- Ensure all environment variables are correctly set
- Verify database schema is properly migrated