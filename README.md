# AdPing: WhatsApp Marketing Platform

AdPing is a comprehensive WhatsApp marketing platform built with Next.js and Drizzle ORM, enabling businesses to send targeted WhatsApp campaigns, manage contacts, and track campaign performance.

## Features

- **Campaign Management**: Create, update, and delete WhatsApp campaigns with status tracking (draft, running, paused, completed, failed).
- **Contact Management**: Add and manage contacts with custom labels for targeted messaging.
- **Template Management**: Create and manage WhatsApp templates for consistent messaging.
- **Real-time Analytics**: Track campaign metrics including sent, delivered, read, failed, and replied counts.
- **Pagination & Filtering**: Efficiently retrieve campaigns with pagination and filtering capabilities.
- **Multi-channel Support**: Built with multi-channel support in mind (email and WhatsApp currently supported).
- **Role-based Access**: Integrates with user management for multi-user support.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: NextAuth.js (Google & Email providers)
- **Real-time**: Socket.io for real-time updates
- **Validation**: Zod
- **Schema**: Shared schema for frontend and backend
- **Utilities**: Redis for caching/queueing, Tailwind CSS for styling

## Project Structure

```
adping/
├── server/                   # Server-side code
│   ├── app/                  # Next.js application routes
│   │   ├── api/
│   │   │   ├── campaigns/
│   │   │   │   ├── route.ts              # Campaign CRUD operations
│   │   │   │   └── whatsapp/
│   │   │   │       └── send/
│   │   │   │           └── route.ts          # Send WhatsApp campaigns
│   │   ├── (auth)/
│   │   ├── (dashboard)/
│   │   └── [catchAll].tsx                # Catch-all for SPA fallback
│   ├── config/
│   │   └── auth.ts                       # NextAuth.js configuration
│   ├── db/
│   │   ├── schema.ts                     # Database schema definitions
│   │   ├── client.ts                     # Drizzle ORM client
│   │   └── seed.ts                       # Database seeding
│   ├── events/
│   │   ├── handler.ts                    # Socket.io event handlers
│   │   └── whatsapp.handler.ts         # WhatsApp specific handlers
│   ├── middleware.ts                     # Authentication middleware
│   ├── repositories/
│   │   ├── campaign.repository.ts        # Campaign repository
│   │   ├── contact.repository.ts         # Contact repository
│   │   └── user.repository.ts            # User repository
│   └── lib/
│       └── redis.ts                      # Redis client
├── shared/                   # Shared code
│   └── schema.ts                 # Database schema shared between client and server
├── components/               # React components
├── app/                      # Frontend application
├── lib/                      # Frontend utilities
└── package.json
```

## Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd adping
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure environment variables**
    Create a `.env.local` file in the root directory with the following variables:

    ```env
    # Database configuration
    DATABASE_URL="postgresql://postgres:[EMAIL_ADDRESS]:5432/adping_db"

    # NextAuth configuration
    NEXTAUTH_SECRET="<generate-a-secret-key>"
    NEXTAUTH_URL="http://localhost:3000"

    # Google OAuth
    GOOGLE_CLIENT_ID="your-google-client-id"
    GOOGLE_CLIENT_SECRET="your-google-client-secret"

    # Redis configuration
    REDIS_URL="redis://localhost:6379"

    # Supabase configuration (optional)
    SUPABASE_URL="your-supabase-url"
    SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

4.  **Run database migrations**
    ```bash
    npx drizzle-kit db:push
    ```
    *Note: For development, `db:push` will create/update tables based on your schema.*

5.  **Seed the database**
    ```bash
    npx tsx server/db/seed.ts
    ```

## Development

**Start the development server**
```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build the application |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed the database |
| `npm run clean` | Clean project (remove node_modules and .next) |

## License

This project is proprietary software. Please refer to the license agreement for terms of use.

## Support

For issues or questions, please contact the development team.
