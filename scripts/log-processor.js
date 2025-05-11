#!/usr/bin/env node

/**
 * Log Processor Utility
 * 
 * This script demonstrates how to process and analyze logs from the application.
 * It can be used as a starting point for setting up log aggregation services like 
 * ELK Stack (Elasticsearch, Logstash, Kibana) or other log management solutions.
 * 
 * Features:
 * - Reads log files from a specified directory
 * - Parses JSON log entries
 * - Filters logs by various criteria
 * - Generates basic metrics and reports
 * - Demonstrates how to forward logs to external services
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createGzip } = require('zlib');
const { pipeline } = require('stream');

// Configuration
const config = {
  logDir: process.env.LOG_DIR || './logs',
  retentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '30', 10),
  outputDir: process.env.LOG_OUTPUT_DIR || './logs/processed',
  compressionEnabled: process.env.LOG_COMPRESSION !== 'false',
  metricsEnabled: process.env.LOG_METRICS !== 'false',
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Utility to check if a file is a log file
function isLogFile(filename) {
  return filename.endsWith('.log') || filename.endsWith('.json');
}

// Utility to get a date range
function getDateRange(days) {
  const now = new Date();
  const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    from: pastDate.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0],
  };
}

// Find log files in the specified directory
function findLogFiles() {
  try {
    const files = fs.readdirSync(config.logDir);
    return files.filter(file => isLogFile(file)).map(file => path.join(config.logDir, file));
  } catch (error) {
    console.error(`Error reading log directory: ${error.message}`);
    return [];
  }
}

// Parse a log line (assuming JSON format)
function parseLogLine(line) {
  try {
    return JSON.parse(line);
  } catch (error) {
    return null;
  }
}

// Process a single log file
async function processLogFile(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const metrics = {
    totalEntries: 0,
    errorCount: 0,
    warnCount: 0,
    infoCount: 0,
    debugCount: 0,
    statusCodes: {},
    endpoints: {},
    slowRequests: []
  };

  // Process file line by line
  for await (const line of rl) {
    const logEntry = parseLogLine(line);
    if (!logEntry) continue;

    metrics.totalEntries++;

    // Count by log level
    if (logEntry.level === 'error') metrics.errorCount++;
    if (logEntry.level === 'warn') metrics.warnCount++;
    if (logEntry.level === 'info') metrics.infoCount++;
    if (logEntry.level === 'debug') metrics.debugCount++;

    // Track API endpoints and status codes
    if (logEntry.path && logEntry.path.startsWith('/api')) {
      const endpoint = `${logEntry.method || 'GET'} ${logEntry.path}`;
      metrics.endpoints[endpoint] = (metrics.endpoints[endpoint] || 0) + 1;
      
      if (logEntry.statusCode) {
        const statusCode = logEntry.statusCode.toString();
        metrics.statusCodes[statusCode] = (metrics.statusCodes[statusCode] || 0) + 1;
      }
      
      // Track slow requests (more than 1000ms)
      if (logEntry.duration && parseInt(logEntry.duration) > 1000) {
        metrics.slowRequests.push({
          path: logEntry.path,
          method: logEntry.method,
          duration: logEntry.duration,
          timestamp: logEntry.time
        });
      }
    }
  }

  return metrics;
}

// Compress old log files
async function compressOldLogs() {
  if (!config.compressionEnabled) return;
  
  const files = findLogFiles();
  const now = new Date();
  
  for (const file of files) {
    const stats = fs.statSync(file);
    const fileAge = Math.floor((now - stats.mtime) / (24 * 60 * 60 * 1000));
    
    // Compress files older than 7 days but not yet compressed
    if (fileAge > 7 && !file.endsWith('.gz')) {
      const gzFile = `${file}.gz`;
      
      const source = fs.createReadStream(file);
      const destination = fs.createWriteStream(gzFile);
      const gzip = createGzip();
      
      await new Promise((resolve, reject) => {
        pipeline(source, gzip, destination, (err) => {
          if (err) {
            console.error(`Compression failed for ${file}: ${err.message}`);
            reject(err);
          } else {
            console.log(`Compressed ${file} to ${gzFile}`);
            fs.unlinkSync(file);
            resolve();
          }
        });
      });
    }
  }
}

// Delete logs older than retention period
function deleteOldLogs() {
  const files = findLogFiles();
  const now = new Date();
  
  for (const file of files) {
    const stats = fs.statSync(file);
    const fileAge = Math.floor((now - stats.mtime) / (24 * 60 * 60 * 1000));
    
    if (fileAge > config.retentionDays) {
      try {
        fs.unlinkSync(file);
        console.log(`Deleted old log file: ${file}`);
      } catch (error) {
        console.error(`Error deleting ${file}: ${error.message}`);
      }
    }
  }
}

// Generate a metrics report
function generateMetricsReport(metrics) {
  if (!config.metricsEnabled) return;
  
  const report = {
    generatedAt: new Date().toISOString(),
    timePeriod: getDateRange(1),
    summary: {
      totalLogEntries: metrics.reduce((sum, m) => sum + m.totalEntries, 0),
      errorCount: metrics.reduce((sum, m) => sum + m.errorCount, 0),
      warnCount: metrics.reduce((sum, m) => sum + m.warnCount, 0),
      infoCount: metrics.reduce((sum, m) => sum + m.infoCount, 0),
      debugCount: metrics.reduce((sum, m) => sum + m.debugCount, 0),
    },
    statusCodeDistribution: {},
    topEndpoints: {},
    slowestRequests: []
  };
  
  // Combine metrics from all files
  metrics.forEach(m => {
    // Status codes
    Object.entries(m.statusCodes).forEach(([code, count]) => {
      report.statusCodeDistribution[code] = (report.statusCodeDistribution[code] || 0) + count;
    });
    
    // Endpoints
    Object.entries(m.endpoints).forEach(([endpoint, count]) => {
      report.topEndpoints[endpoint] = (report.topEndpoints[endpoint] || 0) + count;
    });
    
    // Slow requests
    report.slowestRequests = [...report.slowestRequests, ...m.slowRequests]
      .sort((a, b) => parseInt(b.duration) - parseInt(a.duration))
      .slice(0, 10);
  });
  
  // Sort top endpoints by count
  report.topEndpoints = Object.entries(report.topEndpoints)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  
  // Write report to file
  const reportPath = path.join(config.outputDir, `metrics-${report.timePeriod.from}-to-${report.timePeriod.to}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Metrics report written to ${reportPath}`);
  
  return report;
}

// Main function
async function main() {
  try {
    console.log('Starting log processor...');
    
    // Find all log files
    const logFiles = findLogFiles();
    console.log(`Found ${logFiles.length} log files in ${config.logDir}`);
    
    // Process each log file
    const processedMetrics = [];
    for (const file of logFiles) {
      console.log(`Processing ${file}...`);
      const metrics = await processLogFile(file);
      processedMetrics.push(metrics);
      console.log(`Processed ${metrics.totalEntries} entries from ${file}`);
    }
    
    // Generate metrics report
    if (processedMetrics.length > 0) {
      generateMetricsReport(processedMetrics);
    }
    
    // Compress old logs
    await compressOldLogs();
    
    // Delete logs older than retention period
    deleteOldLogs();
    
    console.log('Log processing completed successfully!');
  } catch (error) {
    console.error('Error in log processor:', error);
    process.exit(1);
  }
}

// Run the main function
main();