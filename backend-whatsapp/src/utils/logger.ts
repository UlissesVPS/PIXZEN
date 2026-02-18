const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.blue}ℹ${colors.reset} ${message}`, ...args);
  },
  
  success: (message: string, ...args: any[]) => {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.green}✓${colors.reset} ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.yellow}⚠${colors.reset} ${message}`, ...args);
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.red}✗${colors.reset} ${message}`, ...args);
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${colors.gray}[${timestamp()}] 🔍 ${message}${colors.reset}`, ...args);
    }
  },
  
  whatsapp: (phone: string, direction: 'in' | 'out', message: string) => {
    const arrow = direction === 'in' ? '📥' : '📤';
    const color = direction === 'in' ? colors.cyan : colors.magenta;
    console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${arrow} ${color}${phone}${colors.reset}: ${message.slice(0, 50)}...`);
  }
};
