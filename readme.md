# 🖥️ Terminal System Monitor Dashboard

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequests.com)

A **professional terminal-based system monitoring dashboard** built with Node.js. Monitor your system's performance in real-time with a beautiful, interactive terminal interface.

![Dashboard Preview](https://via.placeholder.com/800x400/1a1a1a/00ff00?text=TUI+Dashboard+Preview)

## ✨ Features

### 🔍 **Real-time System Monitoring**
- **CPU Usage** - Overall and per-core monitoring with visual progress bars
- **Memory Usage** - RAM consumption with detailed breakdown (total, used, free)
- **Disk Usage** - Storage monitoring for all mounted filesystems
- **Network Activity** - Real-time upload/download rates and total transfer data

### 🎨 **Beautiful Terminal Interface**
- Color-coded progress bars with traffic light system (green/yellow/red)
- Responsive layout that adapts to terminal size
- Unicode characters for enhanced visual appeal
- Professional styling with consistent theming

### ⌨️ **Interactive Controls**
- **q/Escape** - Quit application
- **r** - Manual data refresh
- **h/?** - Help dialog
- **l** - Toggle logging
- **e** - Export data
- **c** - Clear cache

### 🛡️ **Enterprise-Grade Features**
- **Comprehensive Error Handling** - Custom error classes with recovery strategies
- **Smart Caching System** - Reduces system load with intelligent cache management
- **File-based Logging** - Detailed logs that don't interfere with TUI
- **Performance Tracking** - Built-in metrics and statistics
- **Graceful Degradation** - Continues operating even with partial system access

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0.0 or higher
- Terminal with Unicode support
- Sufficient permissions to read system information

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/tui-system-dashboard.git
cd tui-system-dashboard

# Install dependencies
npm install

# Start the dashboard
npm start
\`\`\`

### Development Mode
\`\`\`bash
# Run with auto-restart on file changes
npm run dev
\`\`\`

## 📸 Screenshots

\`\`\`
┌─ CPU Usage ─────┐┌─ Memory Usage ──┐┌─ Disk Usage ────┐┌─ Network Activity ┐
│Usage: 45.2%     ││Usage: 67.8%     ││Disk Usage       ││Network Activity   │
│                 ││                 ││                 ││                   │
│████████░░░ 45.2%││██████████░ 67.8%││/dev/sda1        ││Interface: eth0    │
│                 ││                 ││                 ││                   │
│Cores: 8         ││Total: 16.0 GB   ││████████░░░ 78.5%││↓ Download:        │
│Model: Intel...  ││Used: 10.8 GB    ││Size: 500.0 GB   ││  Total: 1.2 GB   │
│Speed: 3200 MHz  ││Free: 5.2 GB     ││Used: 392.5 GB   ││  Rate: 125.3 KB/s│
│                 ││                 ││Free: 107.5 GB   ││                   │
│Top Cores:       ││                 ││                 ││↑ Upload:          │
│CPU0: 42.1%      ││                 ││                 ││  Total: 0.3 GB   │
│CPU1: 48.3%      ││                 ││                 ││  Rate: 23.7 KB/s │
└─────────────────┘└─────────────────┘└─────────────────┘└───────────────────┘
\`\`\`

## 🏗️ Architecture

The application follows a modular, professional architecture:

\`\`\`
├── index.js                 # Main application entry point
├── lib/
│   ├── system-info.js      # System information collection & caching
│   ├── ui-components.js    # Terminal UI components & formatting
│   ├── event-handler.js    # Keyboard events & user interactions
│   ├── error-handler.js    # Error handling & recovery strategies
│   └── logger.js           # File-based logging system
├── logs/                   # Application logs (auto-created)
└── package.json
\`\`\`

### 🧩 Core Components

| Component | Responsibility |
|-----------|----------------|
| **SystemInfo** | Collects CPU, memory, disk, and network data with smart caching |
| **UIComponents** | Renders terminal widgets with progress bars and formatting |
| **EventHandler** | Manages keyboard shortcuts and user interactions |
| **ErrorHandler** | Provides comprehensive error handling with recovery strategies |
| **Logger** | File-based logging system that doesn't interfere with TUI |

## 🎯 Use Cases

- **System Administrators** - Monitor server performance in SSH sessions
- **Developers** - Track resource usage during development and testing
- **DevOps Engineers** - Quick system health checks in terminal environments
- **Students** - Learn advanced Node.js patterns and terminal UI development

## 🔧 Configuration

The dashboard can be customized through the configuration object in `index.js`:

\`\`\`javascript
this.config = {
  updateInterval: 2000,    // Update frequency in milliseconds
  maxRetries: 3,          // Maximum retry attempts for failed operations
  enableLogging: false,   // Enable/disable file logging
  theme: "default"        // UI theme (extensible)
}
\`\`\`

## 📊 Performance Features

- **Smart Caching** - 2-second cache TTL reduces system load
- **Efficient Updates** - Only renders changed data
- **Memory Management** - Automatic cleanup of expired cache entries
- **Error Rate Limiting** - Prevents error spam
- **Performance Metrics** - Built-in statistics tracking

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Permission errors | Run with appropriate system permissions |
| Garbled display | Ensure terminal supports Unicode |
| High CPU usage | Increase update interval in config |
| Missing data | Check system permissions for `/proc` access |

### Logs Location
- **Main Log**: `logs/dashboard.log`
- **Error Reports**: `logs/errors-[timestamp].json`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup
\`\`\`bash
git clone https://github.com/yourusername/tui-system-dashboard.git
cd tui-system-dashboard
npm install
npm run dev
\`\`\`

## 📚 Learning Resources

This project demonstrates advanced Node.js concepts:
- **Async/Await Patterns** - Proper asynchronous programming
- **Error Handling Strategies** - Custom error classes and recovery
- **Terminal UI Development** - Using blessed for rich interfaces
- **System APIs** - Reading system information
- **Performance Optimization** - Caching and efficient updates
- **Event-Driven Architecture** - Command pattern implementation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Acknowledgments

- [blessed](https://github.com/chjj/blessed) - Terminal interface library
- [systeminformation](https://github.com/sebhildebrandt/systeminformation) - System information API
- [chalk](https://github.com/chalk/chalk) - Terminal string styling

---

**⭐ If you find this project useful, please consider giving it a star on GitHub!**