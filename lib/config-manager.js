import fs from "fs"
import path from "path"

export class ConfigManager {
  constructor() {
    this.configPath = path.join(process.cwd(), "dashboard-config.json")
    this.defaultConfig = {
      updateInterval: 2000,
      theme: "default",
      enableLogging: false,
      logRetention: 1000,
      widgets: {
        cpu: { enabled: true, position: { top: 3, left: 0, width: "33%", height: 12 } },
        memory: { enabled: true, position: { top: 3, left: "33%", width: "34%", height: 12 } },
        disk: { enabled: true, position: { top: 3, left: "67%", width: "33%", height: 12 } },
        network: { enabled: true, position: { top: 15, left: 0, width: "50%", height: 10 } },
        processes: { enabled: true, position: { top: 15, left: "50%", width: "50%", height: 10 } },
        docker: { enabled: false, position: { top: 25, left: 0, width: "100%", height: 8 } },
      },
      alerts: {
        cpu: { threshold: 80, enabled: true },
        memory: { threshold: 85, enabled: true },
        disk: { threshold: 90, enabled: true },
      },
    }

    this.config = this.loadConfig()
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, "utf8")
        return { ...this.defaultConfig, ...JSON.parse(configData) }
      }
    } catch (error) {
      console.error("Error loading config:", error.message)
    }

    return { ...this.defaultConfig }
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2))
      return true
    } catch (error) {
      console.error("Error saving config:", error.message)
      return false
    }
  }

  get(key) {
    return key.split(".").reduce((obj, k) => obj?.[k], this.config)
  }

  set(key, value) {
    const keys = key.split(".")
    const lastKey = keys.pop()
    const target = keys.reduce((obj, k) => {
      if (!obj[k]) obj[k] = {}
      return obj[k]
    }, this.config)

    target[lastKey] = value
    this.saveConfig()
  }

  reset() {
    this.config = { ...this.defaultConfig }
    this.saveConfig()
  }
}