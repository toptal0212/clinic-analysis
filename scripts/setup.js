#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create .env.local file if it doesn't exist
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  const envContent = `# Medical Force API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.medical-force.com/
NEXT_PUBLIC_API_KEY=your_api_key_here

# Development settings
NODE_ENV=development
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
}

console.log('🚀 Setup complete! Run "npm run dev" to start the development server.');