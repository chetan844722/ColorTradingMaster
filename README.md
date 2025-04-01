# Color Trading Platform

A dynamic trading platform leveraging color-based games with advanced user engagement and comprehensive admin controls, designed to provide an interactive and intuitive user experience.

## Key Features

- **User Authentication**: Secure login and registration system with role-based access control
- **Multiple Games**: Various color-based games including Color King, Color Prediction, Lucky Dice, and Trading Master
- **Wallet System**: Comprehensive wallet management with transaction history and UPI payment integration
- **Subscription Model**: Three-tiered subscription system with daily rewards and automatic reward crediting
- **Referral System**: 5% commission on referred user activities
- **In-game Chat**: Real-time chat functionality for all users
- **Admin Dashboard**: Full control panel for managing users, games, transactions, and subscriptions
- **Responsive Design**: Professional UI that works across all device sizes

## Deployment

The platform can be deployed to several cloud platforms. See the [Deployment Guide](DEPLOYMENT.md) for detailed instructions.

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd color-trading-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and update with your configuration.

4. **Initialize the database**
   ```bash
   npm run db:push
   node --loader ts-node/esm scripts/init-data.js
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Subscription Details

- **Basic Plan (₹1,000)**: ₹600/day for 7 days (₹4,200 total)
- **Premium Plan (₹2,000)**: ₹1,200/day for 7 days (₹8,400 total)
- **VIP Plan (₹10,000)**: ₹11,425/day for 7 days (₹79,975 total)

All subscriptions have a 15-day waiting period for withdrawals, and users must upgrade after earning ₹30,000.

## Features

- User authentication system
- Wallet system with admin-approved transactions
- Tiered subscription model with daily rewards
- Multiple interactive color-based games
- Referral commission system (5%)
- In-game chat functionality
- Admin dashboard for complete platform management

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, ShadcnUI
- **Backend**: Express.js, PostgreSQL with Drizzle ORM
- **Real-time**: WebSockets for live game updates and chat
- **Authentication**: Passport.js with session-based auth

## Deployment Options

### 1. Vercel Deployment

1. Fork this repository to your GitHub account
2. Sign up for Vercel (https://vercel.com)
3. Connect your GitHub repository to Vercel
4. Configure the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - Any other secrets needed for your application
5. Deploy the application

### 2. Netlify Deployment

1. Fork this repository to your GitHub account
2. Sign up for Netlify (https://netlify.com)
3. Connect your GitHub repository to Netlify
4. Configure the following environment variables in the Netlify dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - Any other secrets needed for your application
5. Deploy the application using the netlify.toml configuration

### 3. Render Deployment

1. Fork this repository to your GitHub account
2. Sign up for Render (https://render.com)
3. Create a new Web Service and connect your GitHub repository
4. Select "Docker" as the runtime
5. Configure the following environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - Any other secrets needed for your application
6. Deploy the application

### 4. Manual Deployment

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the application: `npm run build`
4. Set up environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - Any other secrets needed for your application
5. Start the application: `npm start`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
```

## Database Setup

The application uses PostgreSQL and Drizzle ORM. To set up the database:

1. Ensure your PostgreSQL server is running
2. Set the `DATABASE_URL` environment variable
3. Run database migrations: `npm run db:push`

## Subscription System

The platform features a three-tiered subscription system:
- Level 1 (₹1,000): ₹600/day reward
- Level 2 (₹2,000): ₹1,200/day reward
- Level 3 (₹10,000): ₹11,425/day reward

Users can withdraw subscription profits after a 15-day waiting period.

## Admin Management

Access the admin dashboard at `/admin` with admin credentials to:
- Manage users, transactions, and subscriptions
- Approve/reject deposits and withdrawals
- Monitor platform activity
- Configure game settings

## Support

For any questions or support, please contact the developer.