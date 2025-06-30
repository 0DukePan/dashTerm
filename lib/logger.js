
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, "..", "logs")
    this.logFile = path.join(this.logDir, "dashboard.log")
    this.maxFileSize = 5 * 1024 * 1024 // 5MB
    this.maxFiles = 5

    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }

    this.currentLevel = "debug" // Show all logs by default

    this.logBuffer = []
    this.bufferSize = 10
    this.flushInterval = 1000 // 1 second

    // Initialize logging system
    this.init()
  }

  async init() {
    try {
      await fs.mkdir(this.logDir, { recursive: true })

      this.startFlushTimer()

      this.info("Logger initialized", {
        logDir: this.logDir,
        logFile: this.logFile,
        level: this.currentLevel,
      })
    } catch (error) {
      console.error("Failed to initialize logger:", error.message)
    }
  }

  startFlushTimer() {
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  shouldLog(level) {
    return this.levels[level] >= this.levels[this.currentLevel]
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      meta,
      pid: process.pid,
    }
    const formattedMessage = this.formatMessage(logEntry)

    // Add to buffer
    this.logBuffer.push(formattedMessage)

    if (level === "error" || this.logBuffer.length >= this.bufferSize) {
      this.flush()
    }
  }

  formatMessage(entry) {
    let formatted = `[${entry.timestamp}] ${entry.level} [PID:${entry.pid}] ${entry.message}`

    if (Object.keys(entry.meta).length > 0) {
      formatted += ` ${JSON.stringify(entry.meta)}`
    }

    return formatted
  }

  async flush() {
    if (this.logBuffer.length === 0) {
      return
    }

    const messages = [...this.logBuffer]
    this.logBuffer = []

    try {
      const content = messages.join("\n") + "\n"
      await fs.appendFile(this.logFile, content)

      await this.checkRotation()
    } catch (error) {
      console.error("Failed to write to log file:", error.message)
      console.error("Lost log messages:", messages.length)
    }
  }

  
  async checkRotation() {
    try {
      const stats = await fs.stat(this.logFile)

      if (stats.size > this.maxFileSize) {
        await this.rotateLog()
      }
    } catch (error) {
      // File might not exist yet, ignore
    }
  }

  async rotateLog() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const rotatedFile = `${this.logFile}.${timestamp}`

      // Move current log to rotated name
      await fs.rename(this.logFile, rotatedFile)

      // Clean up old rotated logs
      await this.cleanupOldLogs()

      // Log the rotation
      this.info("Log file rotated", { rotatedTo: rotatedFile })
    } catch (error) {
      console.error("Failed to rotate log:", error.message)
    }
  }

  
  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir)
      const logFiles = files
        .filter((file) => file.startsWith("dashboard.log."))
        .sort()
        .reverse()

      // Keep only the most recent files
      const filesToDelete = logFiles.slice(this.maxFiles)

      for (const file of filesToDelete) {
        await fs.unlink(path.join(this.logDir, file))
      }
    } catch (error) {
      console.error("Failed to cleanup old logs:", error.message)
    }
  }

  debug(message, meta = {}) {
    this.log("debug", message, meta)
  }

  info(message, meta = {}) {
    this.log("info", message, meta)
  }

  warn(message, meta = {}) {
    this.log("warn", message, meta)
  }

  error(message, meta = {}) {
    this.log("error", message, meta)
  }

  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = level
      this.info("Log level changed", { newLevel: level })
    }
  }

  getLogFile() {
    return this.logFile
  }

  async forceFlush() {
    await this.flush()
  }
}

// 🎓 LEARNING: Export singleton instance
export const logger = new Logger()