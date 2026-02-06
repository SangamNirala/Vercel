# LexAssist - Legal Research Assistant

A Next.js application powered by Lyzr AI for Indian Criminal Law and Corporate Law research assistance.

## Features

- AI-powered legal research assistant
- Document upload and analysis
- RAG (Retrieval Augmented Generation) knowledge base
- Interactive chat interface
- Support for Indian Criminal Law and Corporate Law

## Tech Stack

- **Framework**: Next.js 14
- **UI**: React, Tailwind CSS, shadcn/ui
- **AI**: Lyzr AI Agent Platform
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Lyzr API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/SangamNirala/Vercel.git
cd Vercel
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
LYZR_API_KEY=your-lyzr-api-key-here
NEXT_PUBLIC_LYZR_API_KEY=your-lyzr-api-key-here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3333](http://localhost:3333) in your browser.

## Deployment on Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SangamNirala/Vercel)

### Manual Deployment

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure environment variables:
   - `LYZR_API_KEY`
   - `NEXT_PUBLIC_LYZR_API_KEY`
6. Click "Deploy"

### Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `LYZR_API_KEY` | Your Lyzr API key (server-side) | Yes |
| `NEXT_PUBLIC_LYZR_API_KEY` | Your Lyzr API key (client-side) | Yes |

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── agent/        # AI agent endpoint
│   │   ├── rag/          # RAG knowledge base
│   │   └── upload/       # File upload
│   ├── page.tsx          # Main chat interface
│   └── layout.tsx        # Root layout
├── components/
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/
│   ├── aiAgent.ts        # AI agent utilities
│   ├── ragKnowledgeBase.ts
│   └── ...
└── public/               # Static assets
```

## Available Scripts

- `npm run dev` - Start development server (port 3333)
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## API Routes

- `POST /api/agent` - Call AI agent
- `POST /api/upload` - Upload files for analysis
- `GET /api/rag` - Get RAG documents
- `POST /api/rag` - Upload and train RAG document
- `DELETE /api/rag` - Delete RAG documents

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
