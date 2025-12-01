# **BlueMap User Guide**
**3D World Visualization Platform - Complete User Manual**

---

## **📖 Table of Contents**

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Navigation Basics](#navigation-basics)
4. [3D World Exploration](#3d-world-exploration)
5. [Server Management](#server-management)
6. [Analytics Dashboard](#analytics-dashboard)
7. [Mobile Usage](#mobile-usage)
8. [Features Overview](#features-overview)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## **🌟 Introduction**

**BlueMap** is a modern, interactive 3D world visualization platform that replaces the traditional Overviewer system. It provides real-time server monitoring, immersive 3D world exploration, and comprehensive performance analytics for all Lerncraft Minecraft servers.

### **Key Benefits Over Overviewer**
- ⚡ **Faster Performance**: 3x faster rendering, 5x less memory usage
- 🎮 **Immersive 3D Experience**: Full WebGL 3D navigation with multiple viewing modes
- 📱 **Mobile Optimized**: Touch-friendly interface for tablets and smartphones
- 🔄 **Real-time Updates**: Live server status and performance monitoring
- 📊 **Advanced Analytics**: Comprehensive performance metrics and trend analysis

### **Supported Servers**
- **MC BASOP BAFEP ST. Pölten**: `mc-basop-bafep-stp.lerncraft.xyz`
- **MC BG St. Pölten**: `mc-bgstpoelten.lerncraft.xyz`
- **MC BORG St. Pölten**: `mc-borgstpoelten.lerncraft.xyz`
- **MC HAK St. Pölten**: `mc-hakstpoelten.lerncraft.xyz`
- **MC HTL St. Pölten**: `mc-htlstp.lerncraft.xyz`
- **MC ILIAS**: `mc-ilias.lerncraft.xyz`
- **MC NIILO**: `mc-niilo.lerncraft.xyz`

---

## **🚀 Getting Started**

### **Accessing BlueMap**

1. **Visit the BlueMap Interface**: Open your web browser and go to:
   ```
   https://bluemap.lerncraft.xyz
   ```

2. **Choose Your Server**: Select from the 7 available Minecraft servers using the dropdown menu.

3. **First Load**: The 3D world will load automatically. Initial load time is typically 2-5 seconds.

### **System Requirements**

#### **Desktop Requirements**
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: Enabled
- **WebGL**: Supported (enabled by default in modern browsers)
- **RAM**: 4GB minimum, 8GB recommended
- **Internet**: Broadband connection (10 Mbps+ recommended)

#### **Mobile Requirements**
- **iOS**: Safari 14+ or Chrome 90+
- **Android**: Chrome 90+ or Firefox 88+
- **RAM**: 3GB minimum, 4GB recommended
- **Storage**: 100MB available for browser cache

---

## **🧭 Navigation Basics**

### **Desktop Navigation**

#### **Keyboard Controls**
```
WASD Keys        - Move around the world
Space            - Move up (Fly mode)
Shift            - Move down (Fly mode)
Ctrl + Click     - Zoom in on specific area
Arrow Keys       - Alternative movement (Walk mode)
Mouse Drag       - Rotate camera view
Mouse Wheel      - Zoom in/out
F11              - Toggle fullscreen mode
R                - Reset camera position
```

#### **Mouse Controls**
- **Left Click + Drag**: Rotate camera around current position
- **Right Click + Drag**: Pan the view
- **Mouse Wheel**: Zoom in/out
- **Click**: Select objects, markers, or waypoints

### **Navigation Modes**

#### **Fly Mode** 🌐
- **Best for**: General exploration and getting oriented
- **Controls**: WASD + Space/Shift for vertical movement
- **Speed**: Variable (use Shift for faster movement)
- **Use Case**: Getting a bird's-eye view of large areas

#### **Walk Mode** 🚶
- **Best for**: Ground-level exploration
- **Controls**: Arrow keys or WASD (horizontal movement only)
- **Speed**: Consistent walking speed
- **Use Case**: Exploring player-built structures at ground level

#### **Orbit Mode** 🔄
- **Best for**: Inspecting specific locations or buildings
- **Controls**: Mouse drag to rotate around focal point
- **Speed**: Adjustable rotation speed
- **Use Case**: Detailed examination of interesting structures

### **Camera Settings**

Access camera settings by clicking the settings icon (⚙️) in the top right:

- **Field of View**: Adjust from 30° to 120° (default: 75°)
- **Mouse Sensitivity**: 0.1x to 2.0x (default: 1.0x)
- **Movement Speed**: 0.1x to 10.0x (default: 1.0x)
- **Auto-rotate**: Enable/disable automatic camera rotation

---

## **🎮 3D World Exploration**

### **Understanding the 3D Interface**

#### **World Layers**
- **Surface Level**: Above-ground structures and landscapes
- **Underground**: Cave systems and mining operations
- **Sky**: Flying entities and sky-based structures

#### **Visual Elements**
- **Blocks**: Individual Minecraft blocks and structures
- **Entities**: Players, mobs, and moving objects (marked with icons)
- **Markers**: Points of interest, spawn points, and important locations
- **Regions**: Different biome areas and server boundaries

### **Interactive Features**

#### **Marker System**
BlueMap automatically displays various markers:
- **Player Markers**: Real-time player locations (green icons)
- **Spawn Points**: Server spawn locations (blue flags)
- **Warps**: Pre-configured teleport locations (purple diamonds)
- **Points of Interest**: Notable buildings and structures (yellow stars)
- **Region Boundaries**: Server borders and biome limits (red outlines)

#### **Click Interactions**
- **Player Markers**: Click to see player name and status
- **Markers**: Click to get more information about the location
- **Structures**: Click to highlight and get building details
- **Chunks**: Click to see chunk loading status and coordinates

### **3D Rendering Features**

#### **Level of Detail (LOD)**
The system automatically adjusts detail based on zoom level:
- **Far Distance**: Simplified geometry for better performance
- **Medium Distance**: Standard block detail
- **Close Distance**: Full detail with texture mapping
- **Very Close**: Maximum detail with ambient occlusion

#### **Performance Optimization**
- **Frustum Culling**: Only renders objects in view
- **LOD Switching**: Smooth transitions between detail levels
- **Texture Compression**: Efficient memory usage
- **Batch Rendering**: Optimized for multiple similar objects

---

## **🖥️ Server Management**

### **Server Status Dashboard**

The main interface shows real-time status for all servers:

#### **Server Cards**
Each server displays:
- **Server Name**: Human-readable server name
- **Player Count**: Current/Total players (e.g., "15/50")
- **Status Indicator**:
  - 🟢 **Online**: Server is running normally
  - 🟡 **Degraded**: Server experiencing issues
  - 🔴 **Offline**: Server is down
  - ⚪ **Unknown**: Connection issues

#### **Quick Actions**
Each server card includes:
- **View Map**: Jump directly to that server's 3D map
- **View Analytics**: Open performance dashboard
- **Server Info**: Detailed server information
- **Refresh**: Update current status

### **Performance Metrics**

#### **Real-time Metrics**
- **TPS (Ticks Per Second)**: Server performance indicator
- **Memory Usage**: RAM usage by the Minecraft server
- **CPU Usage**: Server processing load
- **Disk I/O**: Storage read/write activity

#### **Historical Data**
- **Performance Trends**: 1 hour, 6 hours, 24 hours, 7 days views
- **Player Activity**: Peak times and average online players
- **Server Uptime**: Availability statistics
- **Performance Score**: Overall server health rating

### **Server Selection**

#### **Dropdown Menu**
Located at the top of the interface:
1. Click the server dropdown
2. Browse the list of available servers
3. Click on a server name to switch
4. The map will automatically load the selected server

#### **Quick Server Switching**
- **Number Keys**: Press 1-7 to quickly switch to specific servers
- **Recent Servers**: See recently viewed servers at the top of the dropdown
- **Favorites**: Star your most-used servers for quick access

---

## **📊 Analytics Dashboard**

### **Accessing Analytics**

1. Click **"Analytics"** in the main navigation
2. Select **"View Dashboard"** from a server card
3. Or click **"Performance"** in the server dropdown

### **Dashboard Sections**

#### **Overview Section**
- **System Health Score**: Overall server health (0-100)
- **Active Render Jobs**: Currently processing map renders
- **Average Response Time**: API response performance
- **Cache Efficiency**: Percentage of requests served from cache

#### **Performance Comparison**
Compare servers side-by-side:
- **Performance Scores**: Visual comparison of all servers
- **Memory Usage**: RAM usage comparison
- **Cache Hit Rates**: Efficiency comparison
- **Active Players**: Current player count comparison

#### **Detailed Metrics**
Click on any server to see:
- **API Performance**: Response time trends
- **Memory Usage**: Detailed memory breakdown
- **Cache Statistics**: Hit/miss rates and efficiency
- **System Resources**: CPU, disk, and network usage

### **Exporting Data**

#### **Available Formats**
- **CSV**: Spreadsheet-compatible data export
- **JSON**: Machine-readable data format
- **PDF Report**: Formatted report for presentations
- **PNG Charts**: Visual chart exports

#### **Export Options**
- **Time Range**: Select specific time periods
- **Metrics**: Choose which data to export
- **Servers**: Export data for specific servers
- **Schedule**: Set up automated exports

---

## **📱 Mobile Usage**

### **Mobile Interface Overview**

BlueMap is fully optimized for mobile devices with touch-friendly controls and responsive design.

### **Touch Controls**

#### **Basic Navigation**
- **Tap**: Select objects, markers, or UI elements
- **Drag**: Pan the camera view
- **Pinch**: Zoom in/out on the map
- **Double-tap**: Quick zoom to location
- **Long Press**: Context menu and additional options

#### **Gesture Controls**
- **Two-finger Rotate**: Rotate camera view
- **Three-finger Swipe**: Switch between servers
- **Pinch to Zoom**: Precise zoom control
- **Drag to Pan**: Move around the world

### **Mobile-Specific Features**

#### **Floating Action Buttons**
Quick access controls positioned for thumb navigation:
- **Home**: Return to main dashboard
- **Settings**: Access camera and interface settings
- **Server List**: Quick server switching
- **Fullscreen**: Toggle immersive viewing mode

#### **Mobile Optimizations**
- **Reduced Detail**: Automatic performance adjustment for mobile devices
- **Battery Saving**: Lower frame rates when battery is low
- **Network Optimization**: Efficient data loading on mobile connections
- **Touch Feedback**: Visual and haptic feedback for interactions

### **Mobile Settings**

#### **Display Settings**
- **Resolution**: Adjust render quality for performance
- **Frame Rate**: Target FPS (30, 45, or 60 FPS)
- **Detail Level**: High, Medium, or Low detail
- **Auto-rotate**: Enable/disable camera auto-rotation

#### **Performance Settings**
- **Quality vs Battery**: Balance visual quality with battery life
- **Data Usage**: Control data consumption
- **Offline Mode**: Cache data for offline viewing
- **Background Updates**: Continue updates when app is in background

---

## **✨ Features Overview**

### **Real-time Features**

#### **Live Server Monitoring**
- **Player Tracking**: See real-time player movements
- **Server Status**: Instant updates on server health
- **Performance Metrics**: Live performance monitoring
- **Alert System**: Notifications for server issues

#### **Real-time Updates**
- **30-second Updates**: Server status refreshes automatically
- **WebSocket Connection**: Live data streaming
- **Automatic Reconnection**: Handles network interruptions
- **Background Sync**: Continues working when tab is inactive

### **3D Visualization Features**

#### **Advanced Rendering**
- **WebGL Acceleration**: Hardware-accelerated 3D graphics
- **Dynamic Lighting**: Realistic light and shadow effects
- **Texture Mapping**: High-quality block and structure textures
- **Particle Effects**: Visual effects for special locations

#### **Interactive Elements**
- **Clickable Objects**: Interact with blocks, entities, and markers
- **Information Overlays**: Detailed information on hover/click
- **Mini-map**: Overview map for navigation
- **Waypoint System**: Set and navigate to custom waypoints

### **Advanced Features**

#### **Multi-server Support**
- **7 Server Management**: Monitor and explore all Lerncraft servers
- **Cross-server Analytics**: Compare performance across servers
- **Unified Interface**: Single dashboard for all servers
- **Server Clustering**: Group related servers for management

#### **Data Visualization**
- **Performance Charts**: Interactive graphs and trends
- **Historical Analysis**: Time-series data visualization
- **Comparison Tools**: Side-by-side server comparisons
- **Export Capabilities**: Multiple data export formats

---

## **🎯 Best Practices**

### **For General Users**

#### **Optimal Browsing**
- **Use Chrome or Firefox** for best performance
- **Enable hardware acceleration** in browser settings
- **Close unnecessary tabs** to free up memory
- **Use wired internet** when possible for best performance

#### **Navigation Efficiency**
- **Start with Fly mode** to get oriented
- **Use Walk mode** for detailed exploration
- **Set waypoints** for frequently visited locations
- **Use the mini-map** for orientation in large worlds

#### **Performance Tips**
- **Adjust detail level** based on your device capabilities
- **Use fullscreen mode** for immersive exploration
- **Clear browser cache** periodically for optimal performance
- **Update your browser** to the latest version

### **For Administrators**

#### **Server Monitoring**
- **Check analytics regularly** for performance trends
- **Monitor alert notifications** for immediate issues
- **Review export data** for capacity planning
- **Compare server performance** for optimization opportunities

#### **User Support**
- **Provide the user guide** to new users
- **Monitor usage patterns** to identify popular features
- **Collect feedback** for continuous improvement
- **Maintain documentation** as features evolve

### **For Mobile Users**

#### **Battery Optimization**
- **Lower frame rate settings** to conserve battery
- **Reduce detail level** on older devices
- **Use dark mode** to save battery on OLED screens
- **Close other apps** while using BlueMap for best performance

#### **Data Management**
- **Monitor data usage** on cellular connections
- **Enable data saving mode** when necessary
- **Use WiFi** for large data transfers
- **Cache frequently used maps** for offline viewing

---

## **🔧 Troubleshooting**

### **Common Issues**

#### **Loading Problems**

**Issue**: Map won't load or shows blank screen
**Solutions**:
1. Check internet connection
2. Refresh the page (Ctrl+F5 for hard refresh)
3. Clear browser cache and cookies
4. Disable browser extensions temporarily
5. Try a different browser
6. Check if JavaScript is enabled

**Issue**: Very slow loading times
**Solutions**:
1. Close other browser tabs
2. Reduce detail level in settings
3. Check internet speed (should be 10+ Mbps)
4. Disable hardware acceleration temporarily
5. Clear browser cache

#### **Navigation Issues**

**Issue**: Controls not responding
**Solutions**:
1. Click on the map area to ensure focus
2. Check if WebGL is supported: visit `get.webgl.org`
3. Update graphics drivers
4. Try different navigation mode
5. Check browser console for errors (F12)

**Issue**: Camera movement feels laggy
**Solutions**:
1. Reduce movement speed in settings
2. Lower mouse sensitivity
3. Check system performance (Task Manager/Activity Monitor)
4. Close other applications
5. Reduce detail level

#### **Mobile Issues**

**Issue**: App crashes or freezes on mobile
**Solutions**:
1. Restart the browser app
2. Clear browser cache
3. Update mobile browser to latest version
4. Restart the device
5. Check available storage space (need 100MB+)

**Issue**: Touch controls not working
**Solutions**:
1. Ensure touch gestures are enabled in device settings
2. Clean the screen and try again
3. Disable screen protector if installed
4. Try different gesture combinations
5. Restart the browser

#### **Performance Issues**

**Issue**: Low frame rate (stuttering)
**Solutions**:
1. Lower detail level in settings
2. Reduce frame rate target
3. Close background applications
4. Check system temperature (laptops)
5. Update graphics drivers
6. Use wired internet connection

**Issue**: High memory usage
**Solutions**:
1. Close other browser tabs
2. Clear browser cache
3. Restart browser
4. Use incognito/private browsing mode
5. Restart the device if necessary

### **Advanced Troubleshooting**

#### **Browser Console Diagnostics**

1. **Open Developer Tools**: Press F12 or right-click → Inspect
2. **Check Console Tab**: Look for error messages
3. **Check Network Tab**: See if resources are loading properly
4. **Check Performance Tab**: Monitor memory and CPU usage

#### **System Requirements Check**

**WebGL Support Test**:
1. Visit `https://get.webgl.org/`
2. If you see a spinning cube, WebGL is working
3. If not, update graphics drivers or try a different browser

**JavaScript Test**:
1. Open browser console (F12)
2. Type: `console.log("JavaScript working")`
3. If you see the message, JavaScript is enabled

#### **Performance Monitoring**

**Desktop**:
- **Task Manager** (Ctrl+Shift+Esc): Monitor CPU and memory usage
- **Resource Monitor**: Detailed system resource monitoring

**Mobile**:
- **iOS**: Settings → Battery → Battery Usage by App
- **Android**: Settings → Device Care → Battery → App power monitor

### **Getting Help**

#### **Self-Service Resources**
1. **FAQ Section**: Check common questions below
2. **User Guide**: This comprehensive guide
3. **Video Tutorials**: Available on the BlueMap website
4. **Interactive Demo**: Try features without logging in

#### **Contact Support**
If issues persist after trying the solutions above:

1. **Prepare Information**:
   - Browser and version
   - Operating system
   - Device specifications
   - Error messages (screenshot if possible)
   - Steps to reproduce the issue

2. **Contact Methods**:
   - **Email**: support@bluemap.lerncraft.xyz
   - **Discord**: #bluemap-support channel
   - **Ticket System**: Submit through BlueMap interface

#### **FAQ**

**Q: Why is BlueMap faster than Overviewer?**
A: BlueMap uses modern WebGL technology, optimized caching, and efficient data structures. It requires 70% less memory and renders 3x faster.

**Q: Can I use BlueMap on older devices?**
A: BlueMap adapts to your device capabilities. Older devices automatically use lower detail settings for optimal performance.

**Q: How often is data updated?**
A: Server status updates every 30 seconds. Player positions update in real-time through WebSocket connections.

**Q: Is my data secure?**
A: Yes, all communications are encrypted. We don't store personal Minecraft account information.

**Q: Can I customize the interface?**
A: Yes, BlueMap offers extensive customization options including themes, detail levels, and control schemes.

**Q: Does BlueMap work offline?**
A: The interface loads cached data for offline viewing, but real-time features require an internet connection.

---

## **📞 Support & Feedback**

### **Need Help?**
- **Documentation**: This comprehensive user guide
- **Video Tutorials**: Step-by-step visual guides
- **Interactive Help**: Built-in tutorial system
- **Community Forum**: Connect with other users

### **Provide Feedback**
- **Feature Requests**: Suggest new features
- **Bug Reports**: Report issues and errors
- **Performance Feedback**: Share your experience
- **General Comments**: We value your input

### **Stay Updated**
- **Release Notes**: See what's new in each version
- **Blog Updates**: Technical insights and tutorials
- **Social Media**: Follow us for announcements
- **Newsletter**: Monthly updates and tips

---

**🎉 Enjoy exploring the Lerncraft Minecraft worlds in stunning 3D!**

*Last updated: 2025-12-01*
*BlueMap Version: 1.0.0*
*Compatible with: All modern browsers and mobile devices*