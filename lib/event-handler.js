import blessed from "blessed"
export class EventHandler {
  constructor(dashboard, screen, widgets, systemInfo) {
    this.dashboard = dashboard
    this.screen = screen
    this.widgets = widgets
    this.systemInfo = systemInfo

    //  Command registry - maps keys to actions
    this.commands = new Map()
    this.setupCommands()

    console.log("⌨️ EventHandler initialized")
  }

  setupCommands() {
    //  Define all available commands
    this.commands.set("quit", {
      keys: ["escape", "q", "C-c"],
      description: "Quit application",
      execute: () => this.handleQuit(),
    })

    this.commands.set("refresh", {
      keys: ["r"],
      description: "Refresh data",
      execute: () => this.handleRefresh(),
    })

    this.commands.set("help", {
      keys: ["h", "?"],
      description: "Show help",
      execute: () => this.handleHelp(),
    })

    this.commands.set("toggle-logging", {
      keys: ["l"],
      description: "Toggle logging",
      execute: () => this.handleToggleLogging(),
    })

    this.commands.set("export-data", {
      keys: ["e"],
      description: "Export data",
      execute: () => this.handleExportData(),
    })

    this.commands.set("clear-cache", {
      keys: ["c"],
      description: "Clear cache",
      execute: () => this.handleClearCache(),
    })

    console.log(`📋 Registered ${this.commands.size} commands`)
  }

  registerEvents() {
    //  Register each command's key bindings
    for (const [commandName, command] of this.commands) {
      this.screen.key(command.keys, () => {
        console.log(`🎯 Command executed: ${commandName}`)
        command.execute()
      })
    }

    //  Process-level event handlers
    process.on("SIGINT", () => this.handleQuit())
    process.on("SIGTERM", () => this.handleQuit())

    console.log("✅ All event handlers registered")
  }

  handleQuit() {
    console.log("🚪 Quit command received")

    // 🎓 LEARNING: Show confirmation dialog for safety
    this.showConfirmDialog("Quit Application", "Are you sure you want to quit?", () => {
      this.dashboard.handleExit()
    })
  }

  async handleRefresh() {
    console.log("🔄 Refresh command received")

    // Show loading indicator
    this.showStatusMessage("Refreshing data...", "info")

    try {
      // Clear cache to force fresh data
      this.systemInfo.cache.clear()

      // Trigger dashboard update
      await this.dashboard.updateDisplay()
      this.screen.render()

      // Show success message
      this.showStatusMessage("Data refreshed successfully!", "success", 2000)
    } catch (error) {
      console.error("❌ Refresh failed:", error.message)
      this.showStatusMessage(`Refresh failed: ${error.message}`, "error", 3000)
    }
  }

  handleHelp() {
    console.log("❓ Help command received")

    // 🎓 LEARNING: Generate help content from command registry
    let helpContent = "{center}{bold}Keyboard Shortcuts{/bold}{/center}\n\n"

    for (const [commandName, command] of this.commands) {
      const keys = command.keys.join(", ")
      helpContent += `{bold}${keys.padEnd(12)}{/bold} - ${command.description}\n`
    }

    helpContent += "\n{bold}System Info:{/bold}\n"
    helpContent += "• Updates every 2 seconds\n"
    helpContent += "• Data is cached for performance\n"
    helpContent += "• All metrics are real-time\n\n"
    helpContent += "{center}Press any key to close{/center}"

    this.showModalDialog("Help", helpContent)
  }

  handleToggleLogging() {
    console.log("📝 Toggle logging command received")

    // 🎓 LEARNING: Toggle boolean state
    this.dashboard.loggingEnabled = !this.dashboard.loggingEnabled

    const status = this.dashboard.loggingEnabled ? "enabled" : "disabled"
    const color = this.dashboard.loggingEnabled ? "success" : "warning"

    this.showStatusMessage(`Logging ${status}`, color, 2000)

    console.log(`📝 Logging is now ${status}`)
  }

  async handleExportData() {
    console.log("💾 Export data command received")

    this.showStatusMessage("Exporting data...", "info")

    try {
      //  Collect current system data
      const exportData = {
        timestamp: new Date().toISOString(),
        cpu: await this.systemInfo.getCPUInfo(),
        memory: await this.systemInfo.getMemoryInfo(),
        disk: await this.systemInfo.getDiskInfo(),
        network: await this.systemInfo.getNetworkInfo(),
      }

      //  Generate filename with timestamp
      const filename = `system-data-${Date.now()}.json`

      // In a real app, you'd write to file here
      // For this tutorial, we'll just show success
      console.log("💾 Data exported:", exportData)

      this.showStatusMessage(`Data exported to ${filename}`, "success", 3000)
    } catch (error) {
      console.error("❌ Export failed:", error.message)
      this.showStatusMessage(`Export failed: ${error.message}`, "error", 3000)
    }
  }

  handleClearCache() {
    console.log("🧹 Clear cache command received")

    const cacheSize = this.systemInfo.cache.size
    this.systemInfo.cache.clear()

    this.showStatusMessage(`Cache cleared (${cacheSize} entries)`, "success", 2000)
  }

  showStatusMessage(message, type = "info", duration = 0) {
    const colors = {
      info: "blue",
      success: "green",
      warning: "yellow",
      error: "red",
    }

    const color = colors[type] || "white"

    //  Update status bar with colored message
    this.widgets.statusBar.setContent(` {${color}-fg}${message}{/${color}-fg}`)
    this.screen.render()

    //  Auto-restore original content after duration
    if (duration > 0) {
      setTimeout(() => {
        this.widgets.statusBar.setContent(' Press "q" to quit | "r" to refresh | "h" for help ')
        this.screen.render()
      }, duration)
    }
  }

  showModalDialog(title, content, width = 60, height = 20) {
    const dialog = blessed.box({
      top: "center",
      left: "center",
      width: width,
      height: height,
      label: ` ${title} `,
      content: content,
      tags: true,
      border: {
        type: "line",
      },
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: "cyan",
        },
      },
    })

    this.screen.append(dialog)
    dialog.focus()

    // 🎓 LEARNING: Close on any key
    dialog.key(["escape", "enter", "space"], () => {
      this.screen.remove(dialog)
      this.screen.render()
    })

    this.screen.render()
  }

  showConfirmDialog(title, message, onConfirm, onCancel = null) {
    const content = `${message}\n\n{center}Press 'y' to confirm, 'n' to cancel{/center}`

    const dialog = blessed.box({
      top: "center",
      left: "center",
      width: 50,
      height: 10,
      label: ` ${title} `,
      content: content,
      tags: true,
      border: {
        type: "line",
      },
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: "yellow",
        },
      },
    })

    this.screen.append(dialog)
    dialog.focus()

    //  Handle confirmation keys
    dialog.key(["y"], () => {
      this.screen.remove(dialog)
      this.screen.render()
      if (onConfirm) onConfirm()
    })

    dialog.key(["n", "escape"], () => {
      this.screen.remove(dialog)
      this.screen.render()
      if (onCancel) onCancel()
    })

    this.screen.render()
  }

  getCommands() {
    return Array.from(this.commands.entries())
  }
}