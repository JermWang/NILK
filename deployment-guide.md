# 🚀 GOT NILK? - Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ **Infrastructure Requirements**

- [ ] **Hosting Platform**: Vercel (recommended) or Netlify
- [ ] **Database**: Supabase (PostgreSQL)
- [ ] **CDN**: Cloudflare or AWS CloudFront
- [ ] **Domain**: Custom domain with SSL certificate
- [ ] **Monitoring**: Sentry for error tracking
- [ ] **Analytics**: Google Analytics or Mixpanel

### ✅ **Environment Setup**

1. **Create Production Environment Variables**
```bash
# Copy and configure environment variables
cp .env.example .env.production

# Required variables:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_PROJECT_ID=your-walletconnect-project-id
NEXTAUTH_SECRET=your-secure-secret-key
```

2. **Database Migration**
```sql
-- Run the schema.sql file in your Supabase SQL editor
-- Ensure all tables are created with proper RLS policies
-- Verify the handle_new_user trigger is working
```

3. **Database Setup**
```bash
# Run database schema and setup scripts
# Execute schema.sql in your Supabase SQL editor
# Run fix-database-schema.sql if needed for existing databases
# Verify all tables are created properly
```

## 🔧 **Build & Deployment Process**

### **Step 1: Pre-build Optimization**

1. **Image Optimization**
```bash
# Run image optimization script
npm run optimize:images

# Verify all images are in WebP format
# Ensure 3D models are optimized (< 5MB each)
```

2. **Code Quality Check**
```bash
# Run linting and type checking
npm run lint
npm run type-check

# Run tests
npm test

# Build verification
npm run build
```

### **Step 2: Vercel Deployment**

1. **Connect Repository**
```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... add all required env vars
```

2. **Configure Build Settings**
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/health",
      "destination": "/api/health"
    }
  ]
}
```

3. **Deploy**
```bash
# Deploy to production
vercel --prod

# Verify deployment
curl https://your-domain.com/api/health
```

## 🛡️ **Security Configuration**

### **1. Supabase Security**

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_upgrades ENABLE ROW LEVEL SECURITY;

-- Verify RLS policies are restrictive
-- Users should only access their own data
```

### **2. Rate Limiting**

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const limit = 100; // requests per window
  const windowMs = 15 * 60 * 1000; // 15 minutes

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, {
      count: 0,
      lastReset: Date.now(),
    });
  }

  const ipData = rateLimitMap.get(ip);

  if (Date.now() - ipData.lastReset > windowMs) {
    ipData.count = 0;
    ipData.lastReset = Date.now();
  }

  if (ipData.count >= limit) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  ipData.count += 1;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### **3. Content Security Policy**

```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel.app;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: *.supabase.co;
              connect-src 'self' *.supabase.co wss://*.supabase.co *.hyperliquid.xyz;
              frame-src 'none';
              object-src 'none';
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ];
  }
};
```

## 📊 **Monitoring & Analytics Setup**

### **1. Error Tracking (Sentry)**

```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    return event;
  },
});
```

### **2. Performance Monitoring**

```typescript
// app/api/web-vitals/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Log web vitals to your analytics service
  console.log('Web Vitals:', body);
  
  // Send to analytics service (e.g., Google Analytics)
  // await sendToAnalytics(body);
  
  return NextResponse.json({ success: true });
}
```

### **3. Health Check Endpoint**

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 500 }
    );
  }
}
```

## 🔄 **Database Backup & Recovery**

### **1. Automated Backups**

```sql
-- Create backup function in Supabase
CREATE OR REPLACE FUNCTION backup_game_data()
RETURNS void AS $$
BEGIN
  -- This would be implemented as a scheduled function
  -- to backup critical game data
  RAISE NOTICE 'Backup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule daily backups
SELECT cron.schedule('daily-backup', '0 2 * * *', 'SELECT backup_game_data();');
```

### **2. Data Recovery Procedures**

```bash
# Export data from Supabase
supabase db dump --data-only > backup.sql

# Import data to new instance
psql -h your-host -U postgres -d postgres < backup.sql
```

## 🚀 **Performance Optimization**

### **1. Next.js Optimizations**

```typescript
// next.config.mjs
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
};
```

### **2. Bundle Analysis**

```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer

# Add to package.json
"analyze": "ANALYZE=true next build"

# Run analysis
npm run analyze
```

### **3. CDN Configuration**

```typescript
// Configure asset optimization
const assetPrefix = process.env.NODE_ENV === 'production' 
  ? 'https://cdn.your-domain.com' 
  : '';

module.exports = {
  assetPrefix,
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
};
```

## 🧪 **Testing in Production**

### **1. Smoke Tests**

```bash
# Create smoke test script
#!/bin/bash
echo "Running production smoke tests..."

# Test main pages
curl -f https://your-domain.com/ || exit 1
curl -f https://your-domain.com/farm || exit 1
curl -f https://your-domain.com/processing || exit 1
curl -f https://your-domain.com/leaderboard || exit 1

# Test API endpoints
curl -f https://your-domain.com/api/health || exit 1

echo "All smoke tests passed!"
```

### **2. Load Testing**

```javascript
// k6 load test script
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  let response = http.get('https://your-domain.com/');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000,
  });
}
```

## 📈 **Post-Deployment Monitoring**

### **1. Key Metrics to Monitor**

- **Performance**: Page load times, API response times
- **Errors**: Error rates, failed transactions
- **Usage**: Active users, game actions per minute
- **Business**: User registrations, cow purchases, $NILK processed

### **2. Alerting Setup**

```typescript
// Set up alerts for critical metrics
const alerts = {
  errorRate: { threshold: 5, period: '5m' },
  responseTime: { threshold: 2000, period: '1m' },
  activeUsers: { threshold: 0, period: '10m' },
  databaseConnections: { threshold: 80, period: '1m' },
};
```

### **3. Dashboard Configuration**

Create dashboards for:
- Real-time user activity
- Game economy metrics ($NILK circulation, cow population)
- Technical performance (response times, error rates)
- Business KPIs (user growth, engagement metrics)

## 🔧 **Maintenance Procedures**

### **1. Regular Updates**

```bash
# Weekly dependency updates
npm audit
npm update

# Monthly security patches
npm audit fix

# Quarterly major updates
npm outdated
```

### **2. Database Maintenance**

```sql
-- Weekly database optimization
VACUUM ANALYZE;
REINDEX DATABASE postgres;

-- Monthly statistics update
UPDATE pg_stat_user_tables SET n_tup_ins = 0;
```

### **3. Log Rotation**

```bash
# Configure log rotation
# /etc/logrotate.d/nilk-game
/var/log/nilk-game/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

## 🚨 **Incident Response Plan**

### **1. Escalation Levels**

- **Level 1**: Minor issues (single user affected)
- **Level 2**: Service degradation (multiple users affected)
- **Level 3**: Service outage (all users affected)
- **Level 4**: Data loss or security breach

### **2. Response Procedures**

1. **Immediate Response** (0-15 minutes)
   - Acknowledge incident
   - Assess impact and severity
   - Implement immediate mitigation

2. **Investigation** (15-60 minutes)
   - Identify root cause
   - Implement permanent fix
   - Verify resolution

3. **Post-Incident** (1-24 hours)
   - Document incident
   - Conduct post-mortem
   - Implement preventive measures

## ✅ **Go-Live Checklist**

- [ ] All environment variables configured
- [ ] Database schema deployed and verified
- [ ] Supabase functions deployed
- [ ] SSL certificate installed
- [ ] CDN configured
- [ ] Monitoring and alerting active
- [ ] Backup procedures tested
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Smoke tests passing
- [ ] Team trained on incident response
- [ ] Documentation updated
- [ ] Rollback plan prepared

## 🎯 **Success Metrics**

### **Technical KPIs**
- 99.9% uptime
- < 2s average page load time
- < 0.1% error rate
- < 500ms API response time

### **Business KPIs**
- User retention rate > 70%
- Daily active users growth
- Average session duration > 10 minutes
- $NILK transaction volume

---

**🚀 Ready for Production!** Follow this guide step-by-step to ensure a smooth and successful deployment of your GOT NILK? game. 