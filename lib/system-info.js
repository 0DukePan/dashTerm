
import si from "systeminformation"
import { logger } from "./logger.js"

export class SystemInfo {
  constructor() {
    //  Constructor sets up initial state
    this.cache = new Map() // Store cached results
    this.cacheTimeout = 2000 // Cache for 2 seconds

    logger.info("SystemInfo initialized")
  }

  async getCPUInfo() {
    logger.debug("Collecting CPU information...")

    const cacheKey = "cpu"

    //  Check cache first (performance optimization)
    if (this.isInCache(cacheKey)) {
      logger.debug("Using cached CPU data")
      return this.cache.get(cacheKey).data
    }

    try {
      //  systeminformation returns promises
      // We use await to wait for the data
      logger.debug("Fetching fresh CPU data from system...")

      const cpuLoad = await si.currentLoad() // Current CPU usage
      const cpuInfo = await si.cpu() // CPU specifications

      //  Transform raw data into our format
      const result = {
        // Round to 2 decimal places for clean display
        usage: Math.round(cpuLoad.currentLoad * 100) / 100,
        cores: cpuLoad.cpus.length,
        model: cpuInfo.model,
        speed: cpuInfo.speed,

        //  Array.map() transforms each core's data
        coreUsage: cpuLoad.cpus.map((core, index) => ({
          core: index,
          load: Math.round(core.load * 100) / 100,
        })),
      }

      //  Cache the result for future calls
      this.setCache(cacheKey, result)

      logger.debug(`CPU data collected: ${result.usage}% usage`)
      return result
    } catch (error) {
      //  Always handle errors - system calls can fail
      logger.error("Failed to get CPU info", { error: error.message })

      // Return safe default values instead of crashing
      return {
        usage: 0,
        cores: 0,
        model: "Unknown",
        speed: 0,
        coreUsage: [],
      }
    }
  }

  async getMemoryInfo() {
    logger.debug("Collecting memory information...")

    const cacheKey = "memory"

    if (this.isInCache(cacheKey)) {
      logger.debug("Using cached memory data")
      return this.cache.get(cacheKey).data
    }

    try {
      const memInfo = await si.mem()

      //  Helper function for byte conversion
      const bytesToGB = (bytes) => {
        // Convert bytes → KB → MB → GB, round to 2 decimals
        return Math.round((bytes / 1024 / 1024 / 1024) * 100) / 100
      }

      const result = {
        total: bytesToGB(memInfo.total),
        used: bytesToGB(memInfo.used),
        free: bytesToGB(memInfo.free),

        // : Calculate percentage
        usagePercent: Math.round((memInfo.used / memInfo.total) * 100 * 100) / 100,
      }

      this.setCache(cacheKey, result)

      logger.debug(`Memory data collected: ${result.usagePercent}% used`)
      return result
    } catch (error) {
      logger.error("Failed to get memory info", { error: error.message })
      return {
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0,
      }
    }
  }

  async getDiskInfo() {
    logger.debug("Collecting disk information...")

    const cacheKey = "disk"

    if (this.isInCache(cacheKey)) {
      logger.debug("Using cached disk data")
      return this.cache.get(cacheKey).data
    }

    try {
      const diskInfo = await si.fsSize()

      //  Array methods - filter() and map()
      const result = diskInfo
        .filter((disk) => disk.size > 0) // Only real disks, not virtual ones
        .map((disk) => ({
          // Transform each disk object
          filesystem: disk.fs,
          size: Math.round((disk.size / 1024 / 1024 / 1024) * 100) / 100,
          used: Math.round((disk.used / 1024 / 1024 / 1024) * 100) / 100,
          available: Math.round((disk.available / 1024 / 1024 / 1024) * 100) / 100,
          usagePercent: Math.round(disk.use * 100) / 100,
          mount: disk.mount,
        }))

      this.setCache(cacheKey, result)

      logger.debug(`Disk data collected: ${result.length} disks found`)
      return result
    } catch (error) {
      logger.error("Failed to get disk info", { error: error.message })
      return []
    }
  }

  async getNetworkInfo() {
    logger.debug("Collecting network information...")

    const cacheKey = "network"

    if (this.isInCache(cacheKey)) {
      logger.debug("Using cached network data")
      return this.cache.get(cacheKey).data
    }

    try {
      const networkStats = await si.networkStats()

      //  Transform network data for display
      const result = networkStats.map((net) => ({
        interface: net.iface,

        // Convert bytes to MB for readability
        rxMB: Math.round((net.rx_bytes / 1024 / 1024) * 100) / 100,
        txMB: Math.round((net.tx_bytes / 1024 / 1024) * 100) / 100,

        // Current transfer rates (per second)
        rxRate: Math.round((net.rx_sec / 1024) * 100) / 100, // KB/s
        txRate: Math.round((net.tx_sec / 1024) * 100) / 100, // KB/s
      }))

      this.setCache(cacheKey, result)

      logger.debug(`Network data collected: ${result.length} interfaces`)
      return result
    } catch (error) {
      logger.error("Failed to get network info", { error: error.message })
      return []
    }
  }


  isInCache(key) {
    const cached = this.cache.get(key)
    if (!cached) return false

    //  Check if cache is still valid
    const now = Date.now()
    const isValid = now - cached.timestamp < this.cacheTimeout

    if (!isValid) {
      // Cache expired, remove it
      this.cache.delete(key)
      return false
    }

    return true
  }

  setCache(key, data) {
    //  Store data with timestamp
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  clearExpiredCache() {
    const now = Date.now()

    //  Iterate through Map entries
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.cache.delete(key)
        logger.debug(`Cleared expired cache for: ${key}`)
      }
    }
  }

  
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout,
    }
  }
}