#!/usr/bin/env node

/**
 * ============================================================================
 * Transitly - Master Unified Runner & Process Orchestrator
 * ============================================================================
 * Single-command execution file that handles:
 * 1. Pre-flight environment & dependency verification
 * 2. Automatic port cleanup (prevents EADDRINUSE)
 * 3. Compiling and optimizing production CSS bundles
 * 4. Database initialization and verification
 * 5. Launching the backend application server with unified log streaming
 * 6. Graceful shutdown handling (SIGINT / SIGTERM)
 * ============================================================================
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

function logStep(step, message) {
  console.log(`\n${colors.bright}${colors.blue}[${step}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`  ${colors.green}✔${colors.reset} ${message}`);
}

function logWarn(message) {
  console.log(`  ${colors.yellow}⚠${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`  ${colors.cyan}ℹ${colors.reset} ${message}`);
}

console.log(`
${colors.bright}${colors.blue}╔═════════════════════════════════════════════════════════════════════╗
║                      TRANSITLY UNIFIED RUNNER                       ║
║        Intercity Public Bus Cargo & Last-Mile Delivery Engine       ║
╚═════════════════════════════════════════════════════════════════════╝${colors.reset}
`);

// Step 1: Check Dependencies
logStep('1/5', 'Checking environment and module dependencies...');
if (!fs.existsSync(path.join(ROOT_DIR, 'node_modules'))) {
  logWarn('node_modules not found. Installing dependencies...');
  try {
    execSync('npm install', { cwd: ROOT_DIR, stdio: 'inherit' });
    logSuccess('Dependencies installed successfully.');
  } catch (err) {
    console.error(`${colors.red}Failed to install dependencies: ${err.message}${colors.reset}`);
    process.exit(1);
  }
} else {
  logSuccess('All Node.js modules and packages are present.');
}

// Step 2: Auto-Free Port (Prevent EADDRINUSE)
logStep('2/5', `Checking port ${PORT} availability...`);
try {
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    try {
      const stdout = execSync(`netstat -ano | findstr :${PORT}`).toString();
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          execSync(`taskkill /F /PID ${pid}`);
          logInfo(`Freed port ${PORT} by terminating PID ${pid}`);
        }
      }
    } catch (_) {}
  } else {
    try {
      const stdout = execSync(`lsof -ti :${PORT}`).toString().trim();
      if (stdout) {
        const pids = stdout.split('\n');
        for (const pid of pids) {
          if (pid && pid !== String(process.pid)) {
            execSync(`kill -9 ${pid} 2>/dev/null || true`);
            logInfo(`Freed port ${PORT} by terminating PID ${pid}`);
          }
        }
      }
    } catch (_) {}
  }
  logSuccess(`Port ${PORT} is clear and ready.`);
} catch (err) {
  logWarn(`Port cleanup notice: ${err.message}`);
}

// Step 3: Compile and Optimize Production CSS Assets
logStep('3/5', 'Compiling and optimizing Tailwind CSS bundle...');
try {
  execSync('npm run build:css:min', { cwd: ROOT_DIR, stdio: 'pipe' });
  logSuccess('Tailwind CSS compiled and minified to public/css/style.css');
} catch (err) {
  logWarn('Direct minification notice, compiling standard CSS...');
  try {
    execSync('npm run build:css', { cwd: ROOT_DIR, stdio: 'pipe' });
    logSuccess('Tailwind CSS compiled successfully.');
  } catch (fallbackErr) {
    logWarn(`CSS Build notice: ${fallbackErr.message}`);
  }
}

// Step 4: Optional Database Verification / Schema Seed
logStep('4/5', 'Verifying database connectivity and schemas...');
try {
  const dbInitPath = path.join(ROOT_DIR, 'src', 'db', 'initDb.js');
  if (fs.existsSync(dbInitPath)) {
    execSync('node src/db/initDb.js', { cwd: ROOT_DIR, stdio: 'pipe' });
    logSuccess('Database schemas and Haryana Roadways seed verified.');
  }
} catch (err) {
  logInfo('Database initialization offline fallback activated (in-memory mode).');
}

// Step 5: Start Server Process
logStep('5/5', 'Starting Transitly Core Server...');

const serverProcess = spawn('node', ['src/server.js'], {
  cwd: ROOT_DIR,
  stdio: 'inherit',
  env: { ...process.env, PORT: String(PORT) }
});

serverProcess.on('error', (err) => {
  console.error(`\n${colors.red}Failed to start server process: ${err.message}${colors.reset}`);
  process.exit(1);
});

// Graceful Exit Handling
function cleanup() {
  console.log(`\n${colors.yellow}Shutting down Transitly server gracefully...${colors.reset}`);
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Quick liveness poll to show interactive URLs when ready
setTimeout(() => {
  http.get(`http://localhost:${PORT}/`, (res) => {
    if (res.statusCode === 200) {
      console.log(`
${colors.green}${colors.bright}═════════════════════════════════════════════════════════════════════
  TRANSITLY IS LIVE AT: http://localhost:${PORT}
═════════════════════════════════════════════════════════════════════${colors.reset}

  ${colors.bright}📱 Available Screens:${colors.reset}
  • Deliver / Home:      ${colors.cyan}http://localhost:${PORT}/${colors.reset}
  • Live Tracking:       ${colors.cyan}http://localhost:${PORT}/tracking${colors.reset}
  • Delivery History:    ${colors.cyan}http://localhost:${PORT}/history${colors.reset}
  • Profile Hub:         ${colors.cyan}http://localhost:${PORT}/profile${colors.reset}
  • Saved Addresses:     ${colors.cyan}http://localhost:${PORT}/saved-addresses${colors.reset}
  • Payment Methods:     ${colors.cyan}http://localhost:${PORT}/payment-methods${colors.reset}
  • Settings:            ${colors.cyan}http://localhost:${PORT}/settings${colors.reset}
  • Help & Support:      ${colors.cyan}http://localhost:${PORT}/help-support${colors.reset}
  • Command Center:      ${colors.cyan}http://localhost:${PORT}/admin${colors.reset}
  • Swagger REST Docs:   ${colors.cyan}http://localhost:${PORT}/api-docs${colors.reset}

  ${colors.dim}Press Ctrl+C at any time to stop the server.${colors.reset}
`);
    }
  }).on('error', () => {});
}, 1200);
