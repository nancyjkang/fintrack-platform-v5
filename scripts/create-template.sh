#!/bin/bash

# FinTrack v5 - Template Creation Script
# Creates a clean template for rebuilding the application

echo "🏗️ Creating FinTrack v5 application template..."

# Create template directory
TEMPLATE_DIR="fintrack-v5-template"
mkdir -p "$TEMPLATE_DIR"

# Copy essential files for rebuilding
echo "📋 Copying specification and core files..."

# Documentation (the blueprint)
mkdir -p "$TEMPLATE_DIR/docs/features"
cp "docs/features/fintrack-platform-v5-specification.md" "$TEMPLATE_DIR/docs/features/"

# Database schema
mkdir -p "$TEMPLATE_DIR/prisma"
cp "prisma/schema.prisma" "$TEMPLATE_DIR/prisma/"

# Core configuration
cp "package.json" "$TEMPLATE_DIR/"
cp "next.config.js" "$TEMPLATE_DIR/"
cp "tsconfig.json" "$TEMPLATE_DIR/"
cp "tailwind.config.js" "$TEMPLATE_DIR/" 2>/dev/null || echo "Tailwind config not found, skipping..."

# Environment template
cp ".env.example" "$TEMPLATE_DIR/" 2>/dev/null || echo "Env example not found, creating..."
cat > "$TEMPLATE_DIR/.env.example" << 'EOF'
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fintrack_v5"

# JWT Secrets
JWT_ACCESS_SECRET="your-super-secure-access-secret-here"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-here"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Email (for password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EOF

# Core source structure
mkdir -p "$TEMPLATE_DIR/src/lib"
mkdir -p "$TEMPLATE_DIR/src/app/api"
mkdir -p "$TEMPLATE_DIR/src/components"

# Copy essential lib files
cp "src/lib/prisma.ts" "$TEMPLATE_DIR/src/lib/" 2>/dev/null || echo "Prisma lib not found"
cp "src/lib/auth.ts" "$TEMPLATE_DIR/src/lib/" 2>/dev/null || echo "Auth lib not found"

# Create rebuild instructions
cat > "$TEMPLATE_DIR/REBUILD_INSTRUCTIONS.md" << 'EOF'
# FinTrack v5 - Rebuild Instructions

## 🚀 Quick Rebuild Process

### 1. **Setup Environment**
```bash
npm install
cp .env.example .env
# Edit .env with your database credentials and JWT secrets
```

### 2. **Database Setup**
```bash
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed  # If seed file exists
```

### 3. **Follow the Specification**
Open `docs/features/fintrack-platform-v5-specification.md` and implement:

1. **Database Schema** (already done if you ran migrations)
2. **Authentication API** (`/api/auth/*`)
3. **Core APIs** (`/api/accounts`, `/api/transactions`, etc.)
4. **UI Components** (Navigation, Dashboard, Forms)
5. **Integration** (Connect APIs to UI)

### 4. **AI-Assisted Rebuild**
Give this entire specification document to Claude/GPT:

"Please rebuild this application following this specification exactly:
[paste the entire specification document]

Start with the API endpoints, then build the UI components."

### 5. **Verification**
- ✅ All API endpoints respond correctly
- ✅ Database schema matches specification
- ✅ UI matches the requirements
- ✅ Authentication flow works
- ✅ Multi-tenant data isolation works

## 📋 **Implementation Checklist**

### **Phase 1: Foundation**
- [ ] Database schema and migrations
- [ ] Authentication system
- [ ] Basic API structure
- [ ] Error handling middleware

### **Phase 2: Core Features**
- [ ] Account management
- [ ] Transaction CRUD
- [ ] Category system
- [ ] Balance calculations

### **Phase 3: User Interface**
- [ ] Navigation component
- [ ] Dashboard layout
- [ ] Transaction forms
- [ ] Account management UI

### **Phase 4: Advanced Features**
- [ ] CSV import/export
- [ ] Reporting and analytics
- [ ] Goal tracking
- [ ] Audit logging

## 🔧 **Development Commands**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Check code quality
```

## 📚 **Key Files to Implement**
Based on the specification document, focus on these critical files:

1. **API Routes**: `/src/app/api/auth/`, `/src/app/api/accounts/`, etc.
2. **Components**: `/src/components/layout/Navigation.tsx`, etc.
3. **Pages**: `/src/app/dashboard/`, `/src/app/auth/`, etc.
4. **Lib**: `/src/lib/auth.ts`, `/src/lib/prisma.ts`, etc.

The specification document contains all the details you need!
EOF

# Create package.json for template
cat > "$TEMPLATE_DIR/package.json" << 'EOF'
{
  "name": "fintrack-v5-template",
  "version": "1.0.0",
  "description": "FinTrack v5 - Rebuild Template",
  "scripts": {
    "dev": "next dev --turbo",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0",
    "redis": "^4.6.0",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/jsonwebtoken": "^9.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.0.0",
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
EOF

echo "✅ Template created in '$TEMPLATE_DIR/'"
echo ""
echo "🎯 To rebuild the application:"
echo "1. Copy this template to a new directory"
echo "2. Follow the instructions in REBUILD_INSTRUCTIONS.md"
echo "3. Use the specification document as your blueprint"
echo ""
echo "🤖 For AI-assisted rebuild:"
echo "Give the specification document to Claude/GPT and ask them to implement it!"
