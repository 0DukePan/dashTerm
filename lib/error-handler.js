
import chalk from "chalk"
import { logger } from "./logger.js"

export const ErrorTypes = {
  SYSTEM: "system", // OS-level errors (permissions, hardware)
  NETWORK: "network", // Network connectivity issues
  DATA: "data", // Data parsing/validation errors
  UI: "ui", // User interface errors
  PERFORMANCE: "performance", // Performance-related issues
  USER: "user", // User input errors
}

export const ErrorSeverity = {
  LOW: "low", // Minor issues, app continues normally
  MEDIUM: "medium", // Some features affected, app continues
  HIGH: "high", // Major features affected, degraded mode
  CRITICAL: "critical", // App cannot continue, must exit
}

export class DashboardError extends Error {
  constructor(message, type = ErrorTypes.SYSTEM, severity = ErrorSeverity.MEDIUM, details = {}) {
    super(message)
    this.name = "DashboardError"
    this.type = type
    this.severity = severity
    this.details = details
    this.timestamp = new Date().toISOString()

    //  Maintain proper stack trace
    Error.captureStackTrace(this, DashboardError)
  }
}

export class SystemError extends DashboardError {
  constructor(message, details = {}) {
    super(message, ErrorTypes.SYSTEM, ErrorSeverity.HIGH, details)
    this.name = "SystemError"
  }
}

export class DataError extends DashboardError {
  constructor(message, details = {}) {
    super(message, ErrorTypes.DATA, ErrorSeverity.MEDIUM, details)
    this.name = "DataError"
  }
}


export class ErrorHandler {
  constructor(dashboard) {
    this.dashboard = dashboard
    this.errorLog = []
    this.maxLogSize = 100
    this.errorCounts = new Map()
    this.lastErrors = new Map()

    //  Setup global error handlers
    this.setupGlobalHandlers()

    logger.info("ErrorHandler initialized")
  }

  setupGlobalHandlers() {
    // 🎓 LEARNING: Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      this.handleCriticalError("Uncaught Exception", error)
    })

    //  Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      this.handleCriticalError("Unhandled Promise Rejection", reason)
    })

    //  Handle warnings
    process.on("warning", (warning) => {
      this.logError(
        new DashboardError(`Process Warning: ${warning.message}`, ErrorTypes.PERFORMANCE, ErrorSeverity.LOW, {
          warning: warning.name,
          stack: warning.stack,
        }),
      )
    })
  }

  handleError(error, context = {}) {
    //  Normalize error to our format
    const dashboardError = this.normalizeError(error, context)

    // Log the error
    this.logError(dashboardError)

    // Handle based on severity
    switch (dashboardError.severity) {
      case ErrorSeverity.LOW:
        this.handleLowSeverityError(dashboardError)
        break
      case ErrorSeverity.MEDIUM:
        this.handleMediumSeverityError(dashboardError)
        break
      case ErrorSeverity.HIGH:
        this.handleHighSeverityError(dashboardError)
        break
      case ErrorSeverity.CRITICAL:
        this.handleCriticalError("Critical Error", dashboardError)
        break
    }

    // Update error statistics
    this.updateErrorStats(dashboardError)

    return dashboardError
  }

  normalizeError(error, context = {}) {
    if (error instanceof DashboardError) {
      return error
    }

    //  Classify error based on message and context
    let type = ErrorTypes.SYSTEM
    let severity = ErrorSeverity.MEDIUM

    if (error.code === "ENOENT" || error.code === "EACCES") {
      type = ErrorTypes.SYSTEM
      severity = ErrorSeverity.HIGH
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      type = ErrorTypes.NETWORK
      severity = ErrorSeverity.MEDIUM
    } else if (error instanceof SyntaxError) {
      type = ErrorTypes.DATA
      severity = ErrorSeverity.MEDIUM
    }

    return new DashboardError(error.message || "Unknown error", type, severity, {
      originalError: error.name,
      code: error.code,
      context,
      stack: error.stack,
    })
  }

  handleLowSeverityError(error) {
    logger.warn(`Warning: ${error.message}`, { error })

    // Show brief status message
    if (this.dashboard.eventHandler) {
      this.dashboard.eventHandler.showStatusMessage(`Warning: ${error.message}`, "warning", 2000)
    }
  }

  handleMediumSeverityError(error) {
    logger.error(`Error: ${error.message}`, { error })

    // Show user notification
    if (this.dashboard.eventHandler) {
      this.dashboard.eventHandler.showStatusMessage(`Error: ${error.message}`, "error", 3000)
    }

    // Attempt recovery based on error type
    this.attemptRecovery(error)
  }

  handleHighSeverityError(error) {
    logger.error(`High Severity Error: ${error.message}`, { error })

    // Enter degraded mode
    this.enterDegradedMode(error)

    // Show prominent error message
    if (this.dashboard.eventHandler) {
      this.dashboard.eventHandler.showModalDialog(
        "System Error",
        `A serious error occurred:\n\n${error.message}\n\nThe application is running in degraded mode.`,
      )
    }
  }

  handleCriticalError(title, error) {
    logger.error(`CRITICAL ERROR: ${title}`, {
      message: error.message || error,
      stack: error.stack || "No stack trace",
    })

    // Save error log before exit
    this.saveErrorLog()

    // Show critical error message (safe to use console after logging)
    console.error(chalk.red.bold(`💥 CRITICAL ERROR: ${title}`))
    console.error(chalk.red(`Message: ${error.message || error}`))
    console.error(chalk.red.bold("\n🚨 Application must exit due to critical error"))
    console.error(chalk.yellow("Error log saved. Please check logs/dashboard.log for details."))

    // Graceful shutdown
    setTimeout(() => {
      process.exit(1)
    }, 1000)
  }

  attemptRecovery(error) {
    switch (error.type) {
      case ErrorTypes.SYSTEM:
        this.recoverFromSystemError(error)
        break
      case ErrorTypes.DATA:
        this.recoverFromDataError(error)
        break
      case ErrorTypes.NETWORK:
        this.recoverFromNetworkError(error)
        break
      default:
        logger.info("No specific recovery strategy for this error type")
    }
  }

  recoverFromSystemError(error) {
    logger.info("Attempting system error recovery...")

    // Clear system info cache to force refresh
    if (this.dashboard.systemInfo) {
      this.dashboard.systemInfo.cache.clear()
    }

    // Reduce update frequency temporarily
    this.temporarilyReduceUpdateFrequency()
  }

  recoverFromDataError(error) {
    logger.info("Attempting data error recovery...")

    // Reset to default values
    // Clear any corrupted cached data
    if (this.dashboard.systemInfo) {
      this.dashboard.systemInfo.cache.clear()
    }
  }

  recoverFromNetworkError(error) {
    logger.info("Attempting network error recovery...")

    // Implement retry logic for network operations
    // For now, just log the attempt
    logger.info("Network recovery: Will retry on next update cycle")
  }

  enterDegradedMode(error) {
    logger.warn("Entering degraded mode...", { error })

    // Set degraded mode flag
    this.dashboard.degradedMode = true

    // Reduce update frequency
    this.temporarilyReduceUpdateFrequency()

    // Disable non-essential features
    this.dashboard.loggingEnabled = false

    logger.warn("Degraded mode active - some features disabled")
  }

  temporarilyReduceUpdateFrequency() {
    if (this.dashboard.updateInterval) {
      clearInterval(this.dashboard.updateInterval)

      // Double the update interval
      this.dashboard.updateInterval = setInterval(async () => {
        if (this.dashboard.isRunning) {
          try {
            await this.dashboard.updateDisplay()
            this.dashboard.screen.render()
          } catch (error) {
            this.handleError(error, { context: "reduced_frequency_update" })
          }
        }
      }, 4000) // 4 seconds instead of 2

      logger.info("Update frequency reduced to 4 seconds")
    }
  }

  logError(error) {
    //  Maintain error log with size limit
    this.errorLog.push({
      timestamp: error.timestamp || new Date().toISOString(),
      type: error.type,
      severity: error.severity,
      message: error.message,
      details: error.details,
      stack: error.stack,
    })

    //  Prevent memory leaks by limiting log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift() // Remove oldest entry
    }
  }

  updateErrorStats(error) {
    const key = `${error.type}_${error.severity}`
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1)
    this.lastErrors.set(error.type, error)
  }

  saveErrorLog() {
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        errors: this.errorLog,
        statistics: Object.fromEntries(this.errorCounts),
        systemInfo: {
          platform: process.platform,
          nodeVersion: process.version,
          memory: process.memoryUsage(),
        },
      }

      logger.error("Error log data", logData)
    } catch (saveError) {
      logger.error("Failed to save error log", { error: saveError.message })
    }
  }

  getErrorStats() {
    return {
      totalErrors: this.errorLog.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.errorLog.slice(-5), // Last 5 errors
      lastErrorsByType: Object.fromEntries(this.lastErrors),
    }
  }

  clearErrorLog() {
    this.errorLog = []
    this.errorCounts.clear()
    this.lastErrors.clear()
    logger.info("Error log cleared")
  }
}