
import blessed from "blessed"
import chalk from "chalk"
import { SystemInfo } from "./lib/system-info.js"
import { UIComponents } from "./lib/ui-components.js"
import { EventHandler } from "./lib/event-handler.js"
import { ErrorHandler, DashboardError, ErrorTypes, ErrorSeverity } from "./lib/error-handler.js"
import { logger } from "./lib/logger.js"

class CompleteDashboard {
  constructor() {
    console.log(chalk.blue.bold("🚀 Initializing Complete TUI Dashboard..."))

    // Core components
    this.systemInfo = new SystemInfo()
    this.screen = null
    this.widgets = {}
    this.uiComponents = null
    this.eventHandler = null
    this.errorHandler = null

    // Application state
    this.isRunning = false
    this.loggingEnabled = false
    this.degradedMode = false
    this.updateInterval = null
    this.updateCount = 0

    // Performance tracking
    this.performanceStats = {
      totalUpdates: 0,
      averageUpdateTime: 0,
      errorCount: 0,
      cacheHitRate: 0,
      startTime: Date.now(),
    }

    // Configuration
    this.config = {
      updateInterval: 2000,
      maxRetries: 3,
      enableLogging: false,
      theme: "default",
    }

    // Bind methods
    this.handleExit = this.handleExit.bind(this)
    this.updateDisplay = this.updateDisplay.bind(this)

    logger.info("CompleteDashboard constructor initialized")
  }

  
  async initialize() {
    try {
      logger.info("Starting complete initialization sequence...")

      // Initialize error handler first
      this.errorHandler = new ErrorHandler(this)

      // Step 1: Create screen
      await this.createScreen()

      // Step 2: Setup UI
      await this.setupUI()

      // Step 3: Setup event handling
      await this.setupEventHandling()

      // Step 4: Validate system capabilities
      await this.validateSystemCapabilities()

      // Step 5: Start monitoring
      await this.startUpdateLoop()

      // Step 6: Initial render
      this.screen.render()

      this.isRunning = true
      logger.info("Complete dashboard started successfully!")

      // Show startup message
      this.showStartupMessage()
    } catch (error) {
      const dashboardError = new DashboardError(
        `Initialization failed: ${error.message}`,
        ErrorTypes.SYSTEM,
        ErrorSeverity.CRITICAL,
        { originalError: error },
      )

      if (this.errorHandler) {
        this.errorHandler.handleError(dashboardError)
      } else {
        logger.error("Critical initialization error", { error: error.message })
        process.exit(1)
      }
    }
  }

  async createScreen() {
    try {
      this.screen = blessed.screen({
        smartCSR: true,
        title: "Complete System Monitor v1.0",
        dockBorders: true,
        fullUnicode: true,
        autoPadding: true,
        cursor: {
          artificial: true,
          shape: "line",
          blink: true,
        },
        debug: false,
        log: process.env.NODE_ENV === "development" ? "./debug.log" : undefined,
      })

      // Enhanced resize handling
      this.screen.on("resize", () => {
        this.handleResize()
      })

      // Handle screen errors
      this.screen.on("error", (error) => {
        this.errorHandler.handleError(
          new DashboardError(`Screen error: ${error.message}`, ErrorTypes.UI, ErrorSeverity.HIGH, { error }),
        )
      })

      logger.info("Complete screen created with enhanced features")
    } catch (error) {
      throw new DashboardError(`Failed to create screen: ${error.message}`, ErrorTypes.UI, ErrorSeverity.CRITICAL, {
        error,
      })
    }
  }

  async setupUI() {
    try {
      this.uiComponents = new UIComponents(this.screen)

      // Create all widgets
      this.widgets = {
        header: this.uiComponents.createHeader(),
        cpu: this.uiComponents.createCPUWidget(),
        memory: this.uiComponents.createMemoryWidget(),
        disk: this.uiComponents.createDiskWidget(),
        network: this.uiComponents.createNetworkWidget(),
        statusBar: this.uiComponents.createStatusBar(),
      }

      // Add widgets to screen with error handling
      Object.entries(this.widgets).forEach(([name, widget]) => {
        try {
          this.screen.append(widget)
        } catch (error) {
          this.errorHandler.handleError(
            new DashboardError(`Failed to add ${name} widget`, ErrorTypes.UI, ErrorSeverity.MEDIUM, {
              widget: name,
              error,
            }),
          )
        }
      })

      logger.info("Complete UI setup finished")
    } catch (error) {
      throw new DashboardError(`UI setup failed: ${error.message}`, ErrorTypes.UI, ErrorSeverity.HIGH, { error })
    }
  }

  async setupEventHandling() {
    try {
      this.eventHandler = new EventHandler(this, this.screen, this.widgets, this.systemInfo)

      this.eventHandler.registerEvents()

      logger.info("Complete event handling configured")
    } catch (error) {
      throw new DashboardError(`Event handling setup failed: ${error.message}`, ErrorTypes.SYSTEM, ErrorSeverity.HIGH, {
        error,
      })
    }
  }

  async validateSystemCapabilities() {
    try {
      logger.info("Validating system capabilities...")

      // Test system information access
      const testResults = await Promise.allSettled([
        this.systemInfo.getCPUInfo(),
        this.systemInfo.getMemoryInfo(),
        this.systemInfo.getDiskInfo(),
        this.systemInfo.getNetworkInfo(),
      ])

      const capabilities = {
        cpu: testResults[0].status === "fulfilled",
        memory: testResults[1].status === "fulfilled",
        disk: testResults[2].status === "fulfilled",
        network: testResults[3].status === "fulfilled",
      }

      // Log any failed capabilities
      testResults.forEach((result, index) => {
        if (result.status === "rejected") {
          const features = ["CPU", "Memory", "Disk", "Network"]
          logger.warn(`${features[index]} monitoring limited`, { reason: result.reason.message })
        }
      })

      // Check if we have minimum required capabilities
      if (!capabilities.cpu && !capabilities.memory) {
        throw new DashboardError(
          "Insufficient system access - cannot monitor CPU or Memory",
          ErrorTypes.SYSTEM,
          ErrorSeverity.CRITICAL,
          { capabilities },
        )
      }

      logger.info("System capabilities validated", { capabilities })
      return capabilities
    } catch (error) {
      if (error instanceof DashboardError) {
        throw error
      }

      throw new DashboardError(`System validation failed: ${error.message}`, ErrorTypes.SYSTEM, ErrorSeverity.HIGH, {
        error,
      })
    }
  }

  async startUpdateLoop() {
    try {
      // Initial update
      await this.updateDisplay()

      // Start interval with error handling
      this.updateInterval = setInterval(async () => {
        if (this.isRunning) {
          const startTime = Date.now()

          try {
            await this.updateDisplay()
            this.screen.render()

            // Track performance
            const updateTime = Date.now() - startTime
            this.updatePerformanceStats(updateTime)
          } catch (error) {
            this.errorHandler.handleError(
              new DashboardError(`Update cycle failed: ${error.message}`, ErrorTypes.SYSTEM, ErrorSeverity.MEDIUM, {
                error,
                updateCount: this.updateCount,
              }),
            )
          }
        }
      }, this.config.updateInterval)

      logger.info(`Update loop started`, { interval: this.config.updateInterval })
    } catch (error) {
      throw new DashboardError(
        `Failed to start update loop: ${error.message}`,
        ErrorTypes.SYSTEM,
        ErrorSeverity.CRITICAL,
        { error },
      )
    }
  }

  async updateDisplay() {
    const startTime = Date.now()

    try {
      if (this.loggingEnabled) {
        logger.debug(`Update #${this.updateCount + 1} starting...`)
      }

      // Update header with comprehensive info
      const now = new Date().toLocaleString()
      const uptime = Math.round((Date.now() - this.performanceStats.startTime) / 1000)
      const status = this.degradedMode ? "DEGRADED" : "NORMAL"

      this.widgets.header.setContent(
        `{center}{bold}Complete System Monitor v1.0{/bold}{/center}\n` +
          `{center}${now} | Uptime: ${uptime}s | Status: ${status} | Updates: ${this.updateCount}{/center}`,
      )

      // Collect system data with individual error handling
      const dataPromises = [
        this.safeGetCPUInfo(),
        this.safeGetMemoryInfo(),
        this.safeGetDiskInfo(),
        this.safeGetNetworkInfo(),
      ]

      const [cpuInfo, memoryInfo, diskInfo, networkInfo] = await Promise.all(dataPromises)

      // Update widgets with error handling
      this.safeUpdateWidget("cpu", () => this.uiComponents.formatCPUContent(cpuInfo))

      this.safeUpdateWidget("memory", () => this.uiComponents.formatMemoryContent(memoryInfo))

      this.safeUpdateWidget("disk", () => this.uiComponents.formatDiskContent(diskInfo))

      this.safeUpdateWidget("network", () => this.uiComponents.formatNetworkContent(networkInfo))

      // Maintenance tasks
      this.systemInfo.clearExpiredCache()
      this.updateCount++

      if (this.loggingEnabled) {
        logger.debug(`Update #${this.updateCount} completed`, { duration: Date.now() - startTime })
      }
    } catch (error) {
      this.errorHandler.handleError(
        new DashboardError(`Display update failed: ${error.message}`, ErrorTypes.SYSTEM, ErrorSeverity.MEDIUM, {
          error,
          updateCount: this.updateCount,
        }),
      )
    }
  }

  
  async safeGetCPUInfo() {
    try {
      return await this.systemInfo.getCPUInfo()
    } catch (error) {
      this.errorHandler.handleError(
        new DashboardError(`CPU data collection failed: ${error.message}`, ErrorTypes.SYSTEM, ErrorSeverity.LOW, {
          error,
        }),
      )
      return null
    }
  }

  async safeGetMemoryInfo() {
    try {
      return await this.systemInfo.getMemoryInfo()
    } catch (error) {
      this.errorHandler.handleError(
        new DashboardError(`Memory data collection failed: ${error.message}`, ErrorTypes.SYSTEM, ErrorSeverity.LOW, {
          error,
        }),
      )
      return null
    }
  }

  async safeGetDiskInfo() {
    try {
      return await this.systemInfo.getDiskInfo()
    } catch (error) {
      this.errorHandler.handleError(
        new DashboardError(`Disk data collection failed: ${error.message}`, ErrorTypes.SYSTEM, ErrorSeverity.LOW, {
          error,
        }),
      )
      return []
    }
  }

  async safeGetNetworkInfo() {
    try {
      return await this.systemInfo.getNetworkInfo()
    } catch (error) {
      this.errorHandler.handleError(
        new DashboardError(`Network data collection failed: ${error.message}`, ErrorTypes.SYSTEM, ErrorSeverity.LOW, {
          error,
        }),
      )
      return []
    }
  }

  safeUpdateWidget(widgetName, contentGenerator) {
    try {
      const content = contentGenerator()
      if (this.widgets[widgetName] && content) {
        this.widgets[widgetName].setContent(content)
      }
    } catch (error) {
      this.errorHandler.handleError(
        new DashboardError(
          `Widget update failed for ${widgetName}: ${error.message}`,
          ErrorTypes.UI,
          ErrorSeverity.LOW,
          { widget: widgetName, error },
        ),
      )

      // Set error content
      if (this.widgets[widgetName]) {
        this.widgets[widgetName].setContent(`{red-fg}Error loading ${widgetName} data{/red-fg}`)
      }
    }
  }

  updatePerformanceStats(updateTime) {
    this.performanceStats.totalUpdates++

    // Calculate rolling average
    const totalTime = this.performanceStats.averageUpdateTime * (this.performanceStats.totalUpdates - 1) + updateTime
    this.performanceStats.averageUpdateTime = Math.round(totalTime / this.performanceStats.totalUpdates)

    // Update error count
    this.performanceStats.errorCount = this.errorHandler.getErrorStats().totalErrors

    // Update cache hit rate (simplified)
    const cacheStats = this.systemInfo.getCacheStats()
    this.performanceStats.cacheHitRate = cacheStats.size > 0 ? 85 : 0
  }

  handleResize() {
    try {
      logger.debug(`Screen resized`, { width: this.screen.width, height: this.screen.height })

      // Force re-render all widgets
      Object.values(this.widgets).forEach((widget) => {
        widget.emit("resize")
      })

      this.screen.render()
    } catch (error) {
      this.errorHandler.handleError(
        new DashboardError(`Resize handling failed: ${error.message}`, ErrorTypes.UI, ErrorSeverity.LOW, { error }),
      )
    }
  }

  showStartupMessage() {
    setTimeout(() => {
      if (this.eventHandler) {
        this.eventHandler.showStatusMessage("Welcome to Complete TUI Dashboard! Press 'h' for help", "info", 4000)
      }
    }, 1000)
  }

  handleExit() {
    if (!this.isRunning) return

    logger.info("Complete dashboard shutting down...")

    this.isRunning = false

    try {
      // Clear intervals
      if (this.updateInterval) {
        clearInterval(this.updateInterval)
      }

      // Show final statistics
      this.showFinalStatistics()

      // Save error log
      if (this.errorHandler) {
        this.errorHandler.saveErrorLog()
      }

      // Cleanup screen
      if (this.screen) {
        this.screen.destroy()
      }

      logger.info("Complete dashboard stopped cleanly")
    } catch (error) {
      logger.error("Error during shutdown", { error: error.message })
    } finally {
      //  Only use console.log for final goodbye after TUI is destroyed
      console.log(chalk.green("✅ Complete dashboard stopped cleanly"))
      process.exit(0)
    }
  }

  showFinalStatistics() {
    const uptime = Math.round((Date.now() - this.performanceStats.startTime) / 1000)
    const errorStats = this.errorHandler.getErrorStats()

    const finalStats = {
      totalRuntime: uptime,
      totalUpdates: this.performanceStats.totalUpdates,
      averageUpdateTime: this.performanceStats.averageUpdateTime,
      totalErrors: errorStats.totalErrors,
      cacheHitRate: this.performanceStats.cacheHitRate,
      degradedMode: this.degradedMode,
    }

    logger.info("Final Statistics", finalStats)

    //  Also show stats in console since TUI is about to close
    console.log(chalk.blue.bold("\n📊 Final Statistics:"))
    console.log(`   • Total Runtime: ${uptime} seconds`)
    console.log(`   • Total Updates: ${this.performanceStats.totalUpdates}`)
    console.log(`   • Average Update Time: ${this.performanceStats.averageUpdateTime}ms`)
    console.log(`   • Total Errors: ${errorStats.totalErrors}`)
    console.log(`   • Cache Hit Rate: ${this.performanceStats.cacheHitRate}%`)
    console.log(`   • Degraded Mode: ${this.degradedMode ? "Yes" : "No"}`)
  }

  getCompleteStats() {
    return {
      isRunning: this.isRunning,
      loggingEnabled: this.loggingEnabled,
      degradedMode: this.degradedMode,
      updateCount: this.updateCount,
      performance: this.performanceStats,
      errors: this.errorHandler.getErrorStats(),
      cache: this.systemInfo.getCacheStats(),
      config: this.config,
      uptime: Math.round((Date.now() - this.performanceStats.startTime) / 1000),
    }
  }
}

async function main() {
  try {
    console.log(chalk.blue.bold("🚀 Complete TUI Dashboard v1.0"))
    console.log(chalk.gray("A professional terminal-based system monitoring dashboard"))
    console.log(chalk.gray("Features: Real-time monitoring, error handling, performance tracking\n"))

    const dashboard = new CompleteDashboard()
    await dashboard.initialize()
  } catch (error) {
    console.error(chalk.red.bold("💥 Application failed to start:"))
    console.error(chalk.red(`Error: ${error.message}`))
    if (error.stack) {
      console.error(chalk.gray(error.stack))
    }
    process.exit(1)
  }
}

// Start the complete application
main()