# Color Trading Master

A modern color trading platform built with React, Node.js, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ColorTradingMaster.git
cd ColorTradingMaster
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and other settings
```

4. Initialize the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## 🏗️ Building for Production

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## 📱 Mobile Development

For Android development:

```bash
npm run cap:build
npm run cap:android
```

## 🐳 Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. Or build and run manually:
```bash
docker build -t color-trading-master .
docker run -p 3000:3000 --env-file .env color-trading-master
```

## 🔧 Environment Variables

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment (development/production)
- `SESSION_SECRET`: Secret for session encryption
- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: localhost)
- `CORS_ORIGIN`: Allowed CORS origin

Optional variables:

- `STRIPE_SECRET_KEY`: For payment processing
- `VITE_STRIPE_PUBLIC_KEY`: For payment processing

## 📚 Documentation

For detailed deployment instructions and platform-specific guides, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.