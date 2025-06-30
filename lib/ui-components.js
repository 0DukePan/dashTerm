import blessed from "blessed"
import { logger } from "./logger.js"

export class UIComponents {
  constructor(screen) {
    this.screen = screen

    //  Define a consistent color theme
    this.theme = {
      primary: "cyan", // Main accent color
      success: "green", // Good status
      warning: "yellow", // Warnings
      error: "red", // Errors
      info: "blue", // Information
      text: "white", // Default text
      background: "black", // Background
    }

    logger.info("UIComponents initialized with theme")
  }

  createHeader() {
    logger.debug("Creating header component...")

    return blessed.box({
      //  Position properties
      top: 0, // Distance from top
      left: 0, // Distance from left
      width: "100%", // Full width
      height: 3, // 3 lines tall

      //  Content with markup tags
      content: "{center}{bold}System Monitor Dashboard{/bold}{/center}",

      //  Enable markup processing
      tags: true, // Allow {bold}, {center}, etc.

      //  Border styling
      border: {
        type: "line", // Line border style
      },

      //  Color and style properties
      style: {
        fg: this.theme.text, // Foreground (text) color
        bg: this.theme.primary, // Background color
        border: {
          fg: this.theme.primary, // Border color
        },
      },
    })
  }

  createCPUWidget() {
    logger.debug("Creating CPU widget...")

    return blessed.box({
      //  Widget label (shows in border)
      label: " CPU Usage ",

      //  Positioning with percentages
      top: 3, // Below header (header is 3 lines)
      left: 0, // Left edge
      width: "25%", // Quarter of screen width
      height: 10, // 10 lines tall

      content: "Loading...", // Initial content
      tags: true,

      border: {
        type: "line",
      },

      style: {
        fg: this.theme.text,
        border: {
          fg: this.theme.primary, // CPU gets primary color
        },
      },
    })
  }

  createMemoryWidget() {
    logger.debug("Creating memory widget...")

    return blessed.box({
      label: " Memory Usage ",

      //  Positioning next to CPU widget
      top: 3,
      left: "25%", // Start after CPU widget
      width: "25%", // Same width as CPU
      height: 10,

      content: "Loading...",
      tags: true,

      border: {
        type: "line",
      },

      style: {
        fg: this.theme.text,
        border: {
          fg: this.theme.success, // Memory gets success color
        },
      },
    })
  }

  createDiskWidget() {
    logger.debug("Creating disk widget...")

    return blessed.box({
      label: " Disk Usage ",

      top: 3,
      left: "50%", // Third quarter
      width: "25%",
      height: 10,

      content: "Loading...",
      tags: true,

      border: {
        type: "line",
      },

      style: {
        fg: this.theme.text,
        border: {
          fg: this.theme.warning, // Disk gets warning color
        },
      },
    })
  }

  createNetworkWidget() {
    logger.debug("Creating network widget...")

    return blessed.box({
      label: " Network Activity ",

      top: 3,
      left: "75%", // Last quarter
      width: "25%",
      height: 10,

      content: "Loading...",
      tags: true,

      border: {
        type: "line",
      },

      style: {
        fg: this.theme.text,
        border: {
          fg: this.theme.info, // Network gets info color
        },
      },
    })
  }

  createStatusBar() {
    logger.debug("Creating status bar...")

    return blessed.box({
      //  Bottom positioning
      bottom: 0, // Stick to bottom
      left: 0,
      width: "100%",
      height: 3,

      content: ' Press "q" to quit | "r" to refresh | "h" for help ',
      tags: true,

      border: {
        type: "line",
      },

      style: {
        fg: this.theme.text,
        bg: this.theme.background,
        border: {
          fg: this.theme.text,
        },
      },
    })
  }

  createProgressBar(value, max, width = 20) {
    //  Calculate percentage, ensure it's between 0-100
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    //  Calculate how many characters to fill
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled

    //  Unicode characters for visual bars
    const filledChar = "█" // Full block
    const emptyChar = "░" // Light shade

    const bar = filledChar.repeat(filled) + emptyChar.repeat(empty)

    //  Color based on percentage (traffic light system)
    let color = this.theme.success // Green for good
    if (percentage > 80) {
      color = this.theme.error // Red for critical
    } else if (percentage > 60) {
      color = this.theme.warning // Yellow for warning
    }

    //  Return formatted string with color markup
    return `{${color}-fg}${bar}{/${color}-fg} ${percentage.toFixed(1)}%`
  }

  formatCPUContent(cpuInfo) {
    if (!cpuInfo) {
      return "No CPU data available"
    }

    logger.debug("Formatting CPU content...")

    //  Build content string with markup
    let content = `{bold}Usage: ${cpuInfo.usage}%{/bold}\n\n`

    // Add visual progress bar
    content += this.createProgressBar(cpuInfo.usage, 100) + "\n\n"

    // Add system information
    content += `Cores: ${cpuInfo.cores}\n`
    content += `Model: ${cpuInfo.model.substring(0, 20)}...\n` // Truncate long names
    content += `Speed: ${cpuInfo.speed} MHz\n\n`

    //  Show top core usage (slice gets first 3 items)
    if (cpuInfo.coreUsage && cpuInfo.coreUsage.length > 0) {
      content += "{bold}Top Cores:{/bold}\n"
      cpuInfo.coreUsage.slice(0, 3).forEach((core) => {
        content += `CPU${core.core}: ${core.load}%\n`
      })
    }

    return content
  }

  formatMemoryContent(memInfo) {
    if (!memInfo) {
      return "No memory data available"
    }

    logger.debug("Formatting memory content...")

    let content = `{bold}Usage: ${memInfo.usagePercent}%{/bold}\n\n`

    content += this.createProgressBar(memInfo.usagePercent, 100) + "\n\n"

    content += `Total: ${memInfo.total} GB\n`
    content += `Used: ${memInfo.used} GB\n`
    content += `Free: ${memInfo.free} GB\n`

    return content
  }

  formatDiskContent(diskInfo) {
    if (!diskInfo || diskInfo.length === 0) {
      return "No disk data available"
    }

    logger.debug("Formatting disk content...")

    let content = "{bold}Disk Usage{/bold}\n\n"

    //  Show first disk (usually main drive)
    const mainDisk = diskInfo[0]
    content += `{bold}${mainDisk.mount}{/bold}\n`
    content += this.createProgressBar(mainDisk.usagePercent, 100) + "\n\n"
    content += `Size: ${mainDisk.size} GB\n`
    content += `Used: ${mainDisk.used} GB\n`
    content += `Free: ${mainDisk.available} GB\n`

    return content
  }

  formatNetworkContent(networkInfo) {
    if (!networkInfo || networkInfo.length === 0) {
      return "No network data available"
    }

    logger.debug("Formatting network content...")

    let content = "{bold}Network Activity{/bold}\n\n"

    //  Find active interface or use first one
    const activeInterface = networkInfo.find((net) => net.rxRate > 0 || net.txRate > 0) || networkInfo[0]

    content += `Interface: ${activeInterface.interface}\n\n`

    //  Use colors for download/upload
    content += `{${this.theme.success}-fg}↓ Download:{/${this.theme.success}-fg}\n`
    content += `  Total: ${activeInterface.rxMB} MB\n`
    content += `  Rate: ${activeInterface.rxRate} KB/s\n\n`

    content += `{${this.theme.error}-fg}↑ Upload:{/${this.theme.error}-fg}\n`
    content += `  Total: ${activeInterface.txMB} MB\n`
    content += `  Rate: ${activeInterface.txRate} KB/s\n`

    return content
  }

  getTheme() {
    return { ...this.theme } // Return copy to prevent modification
  }

  setTheme(newTheme) {
    this.theme = { ...this.theme, ...newTheme }
    logger.info("Theme updated")
  }
}