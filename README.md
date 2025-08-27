# Duunoii Video Platform

A budget-friendly video platform similar to YouTube/Netflix, built with NestJS and Next.js for learning purposes.

## Tech Stack

- **Backend**: NestJS with TypeScript
- **Frontend**: Next.js with TypeScript & Tailwind CSS
- **Database**: PostgreSQL + Redis
- **Video Processing**: FFmpeg
- **Storage**: Local filesystem (budget-friendly)
- **CDN**: Cloudflare Free Plan

## Quick Start

### Prerequisites

- Node.js 20.x LTS
- Docker & Docker Compose
- FFmpeg (for video processing)

### Installation

```bash
# Clone and install dependencies
npm install

# Start databases
npm run docker:dev

# Start development servers
npm run dev
```

The API will be available at `http://localhost:3001` and the web app at `http://localhost:3000`.

## Development Commands

```bash
# Development
npm run dev              # Start both API and web
npm run dev:api          # Start API only
npm run dev:web          # Start web only

# Building
npm run build            # Build both projects
npm run test             # Run all tests
npm run lint             # Lint all projects

# Docker
npm run docker:dev       # Start databases
npm run docker:down      # Stop all containers
```

## Project Structure

```
├── api/                 # NestJS backend API
├── web/                 # Next.js frontend
├── shared/              # Shared types and utilities
├── infrastructure/      # Docker configs, deployment
└── uploads/             # Local video storage (gitignored)
```

## Budget-Friendly Features

- Local video storage (no AWS S3 costs)
- Free tier deployments (Vercel + Railway)
- Basic 720p video processing
- Up to 100 videos storage limit
- 50-100 concurrent users support

## Development Phases

1. **Phase 1**: Core video upload and playback
2. **Phase 2**: User management and authentication
3. **Phase 3**: Social features (comments, likes)
4. **Phase 4**: Free tier deployment

## License

MIT License