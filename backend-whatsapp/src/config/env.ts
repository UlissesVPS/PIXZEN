import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3333'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // UazAPI
  uazapi: {
    url: process.env.UAZAPI_URL || '',
    token: process.env.UAZAPI_TOKEN || '',
    instance: process.env.UAZAPI_INSTANCE || 'pixzen'
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },

  // PostgreSQL (direto - sem Supabase)
  database: {
    url: process.env.DATABASE_URL || 'postgresql://pixzen_user:pixzen_dev_2026@localhost:5432/pixzen_db'
  },

  // Internal API key (comunicacao entre servicos)
  internalKey: process.env.INTERNAL_API_KEY || 'pixzen-internal-2026-secure'
};

// Validacao
export function validateConfig() {
  const required: [string, string][] = [
    ['UAZAPI_URL', config.uazapi.url],
    ['UAZAPI_TOKEN', config.uazapi.token],
    ['OPENAI_API_KEY', config.openai.apiKey],
    ['DATABASE_URL', config.database.url]
  ];

  const missing = required.filter(([name, value]) => !value);

  if (missing.length > 0) {
    console.error('Missing environment variables:');
    missing.forEach(([name]) => console.error('   - ' + name));
    process.exit(1);
  }

  console.log('Configuration validated successfully');
}
