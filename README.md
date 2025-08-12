# Election Campaign Messaging System

A robust backend API system designed to handle election campaign messaging, built with Node.js, Express, and TypeScript.

## 🎯 Project Overview

This system provides a scalable backend infrastructure for managing election campaign communications, including:

- Campaign message management
- Voter outreach coordination
- Message scheduling and delivery
- Analytics and reporting

## 🏗️ Architecture

- **Backend Framework**: Express.js with TypeScript
- **Runtime**: Node.js
- **Development**: Hot-reload with ts-node-dev
- **API**: RESTful endpoints with CORS support
- **Environment**: Configurable via .env files

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/piyush2997/election-campaign-messaging.git

# Navigate to project directory
cd election-campaign-messaging

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start development server with hot-reload
npm run dev

# The server will start on http://localhost:5000 (or PORT from .env)
```

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
election-campaign-messaging/
├── src/                    # Source code directory
│   └── index.ts           # Main application entry point
├── dist/                   # Compiled JavaScript output (generated)
├── node_modules/           # Dependencies (generated)
├── .env                    # Environment variables (create from .env.example)
├── .gitignore             # Git ignore patterns
├── package.json            # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
# Add other configuration variables as needed
```

### TypeScript Configuration

- **Target**: ES2020
- **Module System**: CommonJS
- **Strict Mode**: Enabled
- **Output Directory**: `./dist`

## 📡 API Endpoints

### Current Endpoints

- `GET /` - Health check endpoint

### Planned Endpoints

- Campaign management
- Message creation and scheduling
- Voter contact management
- Analytics and reporting

## 🛠️ Development

### Code Style

- Follow TypeScript best practices
- Use meaningful variable names
- Implement proper error handling
- Write self-documenting code

### Adding New Features

1. Create new TypeScript files in the `src/` directory
2. Follow the established project structure
3. Update this README with new endpoints/features
4. Test thoroughly before committing

## 📦 Dependencies

### Production Dependencies

- `express`: Web framework
- `cors`: Cross-origin resource sharing
- `dotenv`: Environment variable management

### Development Dependencies

- `typescript`: TypeScript compiler
- `ts-node-dev`: Development server with hot-reload
- `@types/*`: TypeScript type definitions

## 🚀 Deployment

### Build Process

```bash
npm run build
```

### Environment Setup

- Ensure all environment variables are properly configured
- Set `NODE_ENV=production`
- Configure your production PORT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:

- Create an issue on GitHub
- Check the existing documentation
- Review the code structure

---

**Built with ❤️ for transparent and effective election campaign management**
