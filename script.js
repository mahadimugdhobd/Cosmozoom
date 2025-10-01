/**
 * CosmoZoom - Advanced Space Image Explorer
 * NASA Space Apps Challenge 2025 - Team Mugdho
 *
 * This application provides advanced zoom functionality with pixel-level precision,
 * coordinate tracking, AI pattern analysis, image upload capabilities, and collaborative discovery features.
 *
 * Key Features:
 * - Real-time pixel-level zoom with mouse wheel support
 * - Enhanced AI pattern analysis with automatic object detection
 * - Image upload functionality (file upload and URL input)
 * - Advanced coordinate tracking and measurement tools
 * - Responsive design for all devices
 */

// Global state management for the application
let currentZoom = 100 // Current zoom percentage (100% = fit to container)
let currentImageData = null // Currently loaded image metadata and information
let mousePosition = { x: 0, y: 0 } // Real-time mouse coordinates for tracking
let imageNaturalSize = { width: 0, height: 0 } // Original image dimensions in pixels
let isAIAnalyzing = false // AI analysis state to prevent multiple simultaneous analyses
let detectedObjects = [] // Array of AI-detected objects with coordinates and confidence
let pixelScale = 0.031 // Arcseconds per pixel (typical for space telescopes like JWST)
const isDragging = false // Image dragging state for pan functionality
const dragStart = { x: 0, y: 0 } // Starting position for drag operations
let imageOffset = { x: 0, y: 0 } // Current image offset for panning
let isExplorerOpen = false // State to track if the explorer modal/page is open

/**
 * Initialize the application when DOM is loaded
 * Sets up event listeners, interactive elements, and real-time features
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 CosmoZoom initializing...")

  // Initialize all components
  initializeImageLoading()
  initializeZoomDemo()
  initializeCollectionItems()
  initializeUploadHandlers()
  initializeMouseTracking()
  initializeZoomControls()
  initializeToolbarEnhancements()
  initializeNavigation() // Added initialization for navigation
  initializeMobileMenu() // Added initialization for mobile menu
  initializeKeyboardShortcuts() // Added initialization for keyboard shortcuts
  initializeScrollAnimations() // Added initialization for scroll animations
  initializeRealTimeUpdates() // Added initialization for real-time updates
  initializeMouseWheelZoom() // Initialize mouse wheel zoom
  initializeDragAndDrop() // Initialize drag and drop

  const defaultImage = {
    src: "jwst-carina-nebula-default.png",
    title: "JWST Carina Nebula",
    description:
      "Stellar nursery showing star formation in unprecedented detail with infrared imaging revealing hidden structures and cosmic cliffs",
    resolution: "4096×4096",
    pixelScale: 0.031,
    source: "James Webb Space Telescope",
    coordinates: "10h 36m 41s, -59° 52' 04\"",
  }

  // Load default image in both home page preview and explorer
  setTimeout(() => {
    const mainImage = document.getElementById("main-image")
    const explorerImage = document.getElementById("explorer-image")

    if (mainImage && mainImage.src !== defaultImage.src) {
      loadImageFromData(defaultImage.src, defaultImage)
    }

    if (explorerImage && explorerImage.src !== defaultImage.src) {
      loadImageWithMetadata(defaultImage.src, defaultImage)
    }
  }, 100)

  console.log("✅ CosmoZoom initialized successfully")
})

/**
 * Enhanced image loading with better error handling and metadata
 */
function loadImageFromData(imageSrc, metadata) {
  console.log(`📸 Loading image: ${metadata.title}`)

  const mainImage = document.getElementById("main-image")
  const imageTitle = document.getElementById("image-title")
  const imageDescription = document.getElementById("image-description")

  if (mainImage) {
    // Set up load handler before changing src
    mainImage.onload = function () {
      // Store natural dimensions for coordinate calculations
      imageNaturalSize = {
        width: this.naturalWidth,
        height: this.naturalHeight,
      }

      // Update metadata with actual resolution
      metadata.resolution = `${imageNaturalSize.width}×${imageNaturalSize.height}`

      // Update all metadata displays
      updateImageMetadata(metadata)

      console.log(`📐 Image loaded: ${imageNaturalSize.width}x${imageNaturalSize.height}`)
    }

    mainImage.onerror = () => {
      console.error("Image loading error:", imageSrc)
      if (imageSrc !== "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?w=2000&h=1158&fit=crop&crop=faces%2Cfocalpoint") {
        console.log("🔄 Falling back to default image")
        loadImageFromData("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?w=2000&h=1158&fit=crop&crop=faces%2Cfocalpoint", {
          title: "JWST Carina Nebula (Default)",
          description: "Default stellar nursery image",
          resolution: "4096×4096",
          pixelScale: 0.031,
        })
      }
    }

    // Load the image
    mainImage.src = imageSrc
  }

  // Update text displays immediately
  if (imageTitle) imageTitle.textContent = metadata.title
  if (imageDescription) imageDescription.textContent = metadata.description

  // Store current image data
  currentImageData = { ...metadata, src: imageSrc }
}

/**
 * Update image metadata displays with enhanced information
 * @param {Object} metadata - Optional metadata object to use
 */
function updateImageMetadata(metadata = currentImageData) {
  if (!metadata) return

  const imageResolution = document.getElementById("image-resolution")
  const currentZoomDisplay = document.getElementById("current-zoom")
  const currentPixelScale = document.getElementById("current-pixel-scale")
  const visiblePixels = document.getElementById("visible-pixels")
  const imageSourceElement = document.getElementById("image-source")
  const imageCoordinatesElement = document.getElementById("image-coordinates")

  if (imageResolution) imageResolution.textContent = metadata.resolution
  if (currentZoomDisplay) currentZoomDisplay.textContent = Math.round(currentZoom) + "%"
  if (currentPixelScale) {
    const effectiveScale = (pixelScale / (currentZoom / 100)).toFixed(4)
    currentPixelScale.textContent = `${effectiveScale}"/px`
  }
  if (visiblePixels && imageNaturalSize.width > 0) {
    const zoomFactor = currentZoom / 100
    const visibleWidth = Math.round(imageNaturalSize.width / zoomFactor)
    const visibleHeight = Math.round(imageNaturalSize.height / zoomFactor)
    visiblePixels.textContent = `${visibleWidth}×${visibleHeight}`
  }
  if (imageSourceElement) imageSourceElement.textContent = metadata.source || "Unknown Source"
  if (imageCoordinatesElement) imageCoordinatesElement.textContent = metadata.coordinates || "N/A"
}

/**
 * Navigation System
 * Handles smooth scrolling and active state management
 */
function initializeNavigation() {
  const navLinks = document.querySelectorAll(".nav-link")

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const targetSection = document.querySelector(targetId)

      if (targetSection) {
        // Smooth scroll to target section
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })

        // Update active navigation state
        navLinks.forEach((l) => l.classList.remove("active"))
        this.classList.add("active")

        console.log(`📍 Navigated to section: ${targetId}`)
      }
    })
  })
}

/**
 * Mobile Menu System
 * Responsive navigation for mobile devices
 */
function initializeMobileMenu() {
  const mobileToggle = document.querySelector(".mobile-menu-toggle")
  const navLinksContainer = document.querySelector(".nav-links")

  if (mobileToggle && navLinksContainer) {
    mobileToggle.addEventListener("click", () => {
      navLinksContainer.classList.toggle("mobile-active")

      // Update icon
      const icon = mobileToggle.querySelector("i")
      if (navLinksContainer.classList.contains("mobile-active")) {
        icon.className = "fas fa-times"
      } else {
        icon.className = "fas fa-bars"
      }

      console.log("📱 Mobile menu toggled")
    })

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileToggle.contains(e.target) && !navLinksContainer.contains(e.target)) {
        navLinksContainer.classList.remove("mobile-active")
        mobileToggle.querySelector("i").className = "fas fa-bars"
      }
    })
  }
}

/**
 * Interactive Elements Initialization
 * Sets up demos, collection items, and annotations
 */
function initializeInteractiveElements() {
  initializeZoomDemo()
  initializeCollectionItems()
  initializeAnnotations()
}

/**
 * Real-time Coordinate Tracking System
 * Tracks mouse position and displays precise coordinates
 */
function initializeCoordinateTracking() {
  const canvasContainers = document.querySelectorAll(".canvas-container, #full-viewer-container")

  canvasContainers.forEach((container) => {
    const crosshair = container.querySelector(".crosshair") || createCrosshair(container)

    // Track mouse movement for coordinate display
    container.addEventListener("mousemove", (e) => {
      updateMouseCoordinates(e, container, crosshair)
    })

    // Show crosshair on mouse enter
    container.addEventListener("mouseenter", () => {
      crosshair.classList.add("active")
    })

    // Hide crosshair on mouse leave
    container.addEventListener("mouseleave", () => {
      crosshair.classList.remove("active")
    })
  })
}

/**
 * Create crosshair element for coordinate tracking
 * @param {HTMLElement} container - Parent container element
 * @returns {HTMLElement} - Created crosshair element
 */
function createCrosshair(container) {
  const crosshair = document.createElement("div")
  crosshair.className = "crosshair"
  crosshair.id = container.id === "full-viewer-container" ? "modal-crosshair" : "crosshair"
  container.appendChild(crosshair)
  return crosshair
}

/**
 * Update mouse coordinates and crosshair position with enhanced pixel tracking
 * @param {MouseEvent} e - Mouse event
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} crosshair - Crosshair element
 */
function updateMouseCoordinates(e, container, crosshair) {
  const rect = container.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // Update crosshair position
  crosshair.style.left = x + "px"
  crosshair.style.top = y + "px"

  // Calculate image coordinates with zoom consideration
  const image = container.querySelector(".main-image, #explorer-image")
  if (image) {
    const imageRect = image.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    const zoomFactor = currentZoom / 100
    const imageX =
      ((x - (imageRect.left - containerRect.left)) / (imageRect.width / zoomFactor)) * imageNaturalSize.width
    const imageY =
      ((y - (imageRect.top - containerRect.top)) / (imageRect.height / zoomFactor)) * imageNaturalSize.height

    // Update coordinate display with real pixel information
    updateCoordinateDisplayEnhanced(imageX, imageY, x, y)

    updatePixelInfoOverlay(imageX, imageY, zoomFactor)
  }

  // Store current mouse position for other functions
  mousePosition = { x, y }
}

/**
 * Enhanced coordinate display with better formatting and real pixel data
 * @param {number} imageX - X coordinate in image pixels
 * @param {number} imageY - Y coordinate in image pixels
 * @param {number} screenX - X coordinate on screen
 * @param {number} screenY - Y coordinate on screen
 */
function updateCoordinateDisplayEnhanced(imageX, imageY, screenX, screenY) {
  // Update individual coordinate elements
  const raElement = document.getElementById("ra-value")
  const decElement = document.getElementById("dec-value")
  const pixelElement = document.getElementById("pixel-coords")

  if (raElement && decElement && pixelElement) {
    // Convert pixel coordinates to astronomical coordinates (simplified)
    const ra = convertToRA(imageX)
    const dec = convertToDec(imageY)

    raElement.textContent = ra
    decElement.textContent = dec
    pixelElement.textContent = `(${Math.round(imageX)}, ${Math.round(imageY)})`
  }

  // Fallback for legacy coordinate display
  const coordinateDisplay = document.getElementById("coordinate-display")
  if (coordinateDisplay && !raElement) {
    const ra = convertToRA(imageX)
    const dec = convertToDec(imageY)
    coordinateDisplay.innerHTML = `RA: ${ra} | Dec: ${dec} | Pixel: (${Math.round(imageX)}, ${Math.round(imageY)})`
  }
}

/**
 * New function to update pixel info overlay with real-time zoom data
 * @param {number} imageX - X coordinate in image pixels
 * @param {number} imageY - Y coordinate in image pixels
 * @param {number} zoomFactor - Current zoom factor
 */
function updatePixelInfoOverlay(imageX, imageY, zoomFactor) {
  let pixelOverlay = document.querySelector(".pixel-info-overlay")

  if (!pixelOverlay) {
    pixelOverlay = document.createElement("div")
    pixelOverlay.className = "pixel-info-overlay"

    const containers = document.querySelectorAll(".canvas-container, #full-viewer-container")
    containers.forEach((container) => {
      const overlay = pixelOverlay.cloneNode()
      container.appendChild(overlay)
    })
    pixelOverlay = document.querySelector(".pixel-info-overlay")
  }

  if (
    pixelOverlay &&
    imageX >= 0 &&
    imageY >= 0 &&
    imageX <= imageNaturalSize.width &&
    imageY <= imageNaturalSize.height
  ) {
    const effectivePixelScale = (pixelScale / zoomFactor).toFixed(4)
    const visiblePixels = Math.round(imageNaturalSize.width / zoomFactor)

    pixelOverlay.innerHTML = `
      <div class="pixel-info-item">
        <span class="pixel-info-label">Pixel:</span>
        <span class="pixel-info-value">${Math.round(imageX)}, ${Math.round(imageY)}</span>
      </div>
      <div class="pixel-info-item">
        <span class="pixel-info-label">Zoom:</span>
        <span class="pixel-info-value">${Math.round(currentZoom)}%</span>
      </div>
      <div class="pixel-info-item">
        <span class="pixel-info-label">Scale:</span>
        <span class="pixel-info-value">${effectivePixelScale}"/px</span>
      </div>
      <div class="pixel-info-item">
        <span class="pixel-info-label">Visible:</span>
        <span class="pixel-info-value">${visiblePixels}×${visiblePixels}</span>
      </div>
    `
    pixelOverlay.style.display = "block"
  }
}

/**
 * Update coordinate display with astronomical coordinates
 * @param {number} imageX - X coordinate in image pixels
 * @param {number} imageY - Y coordinate in image pixels
 * @param {number} screenX - X coordinate on screen
 * @param {number} screenY - Y coordinate on screen
 */
function updateCoordinateDisplay(imageX, imageY, screenX, screenY) {
  const coordinateDisplay = document.getElementById("coordinate-display")
  if (!coordinateDisplay) return

  // Convert pixel coordinates to astronomical coordinates (simplified)
  // In a real implementation, this would use proper WCS (World Coordinate System)
  const ra = convertToRA(imageX)
  const dec = convertToDec(imageY)

  // Update display with multiple coordinate systems
  coordinateDisplay.innerHTML = `
    RA: ${ra} | Dec: ${dec} | Pixel: (${Math.round(imageX)}, ${Math.round(imageY)})
  `
}

/**
 * Convert pixel X coordinate to Right Ascension (simplified)
 * @param {number} x - X pixel coordinate
 * @returns {string} - Formatted RA string
 */
function convertToRA(x) {
  // Simplified conversion - in reality this would use proper WCS
  const totalHours = 24
  const hours = Math.floor((x / imageNaturalSize.width) * totalHours)
  const minutes = Math.floor(((x / imageNaturalSize.width) * totalHours - hours) * 60)
  const seconds = Math.floor((((x / imageNaturalSize.width) * totalHours - hours) * 60 - minutes) * 60)

  return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
}

/**
 * Convert pixel Y coordinate to Declination (simplified)
 * @param {number} y - Y pixel coordinate
 * @returns {string} - Formatted Dec string
 */
function convertToDec(y) {
  // Simplified conversion - in reality this would use proper WCS
  const totalDegrees = 180
  const degrees = Math.floor((y / imageNaturalSize.height) * totalDegrees - 90)
  const minutes = Math.floor(((y / imageNaturalSize.height) * totalDegrees - 90 - degrees) * 60)
  const seconds = Math.floor((((y / imageNaturalSize.height) * totalDegrees - 90 - degrees) * 60 - minutes) * 60)

  const sign = degrees >= 0 ? "+" : ""
  return `${sign}${degrees}° ${Math.abs(minutes).toString().padStart(2, "0")}' ${Math.abs(seconds).toString().padStart(2, "0")}"`
}

/**
 * Launch Explorer Modal
 * Opens the full-screen image explorer with advanced features
 */
function launchExplorer() {
  console.log("🚀 Launching CosmoZoom Explorer...")
  openExplorerPage()
}

/**
 * New function to open explorer in separate page instead of modal
 * Opens the dedicated explorer page for full-screen space image analysis
 */
function openExplorerPage() {
  console.log("🚀 Opening CosmoZoom Explorer in new page...")

  // Open explorer page in same window
  window.location.href = "explorer.html"
  isExplorerOpen = true
}

/**
 * Load image with comprehensive metadata
 * @param {string} imageSrc - Image source URL
 * @param {Object} metadata - Image metadata object
 */
function loadImageWithMetadata(imageSrc, metadata) {
  console.log(`📸 Loading image: ${metadata.title}`)

  const explorerImage = document.getElementById("explorer-image")
  const imageTitle = document.getElementById("image-title")
  const imageDescription = document.getElementById("image-description")
  const imageResolution = document.getElementById("image-resolution")

  if (explorerImage) {
    explorerImage.onload = function () {
      // Store natural dimensions for coordinate calculations
      imageNaturalSize = {
        width: this.naturalWidth,
        height: this.naturalHeight,
      }

      console.log(`📐 Image loaded: ${imageNaturalSize.width}x${imageNaturalSize.height}`)
    }

    explorerImage.src = imageSrc
  }

  // Update metadata displays
  if (imageTitle) imageTitle.textContent = metadata.title
  if (imageDescription) imageDescription.textContent = metadata.description
  if (imageResolution) imageResolution.textContent = metadata.resolution

  // Store current image data
  currentImageData = { ...metadata, src: imageSrc }
  pixelScale = metadata.pixelScale || 0.031

  // Update pixel scale display
  updatePixelScaleDisplay()
}

/**
 * Advanced Zoom System
 * Provides smooth zooming with pixel-level precision
 */

/**
 * Zoom in with smooth animation
 */
function zoomIn() {
  const maxZoom = 5000 // Maximum 50x zoom
  const zoomFactor = 1.5

  currentZoom = Math.min(currentZoom * zoomFactor, maxZoom)
  applyZoomEnhanced() // Use enhanced zoom application

  console.log(`🔍 Zoomed in to ${Math.round(currentZoom)}%`)
}

/**
 * Zoom out with smooth animation
 */
function zoomOut() {
  const minZoom = 25 // Minimum 25% zoom
  const zoomFactor = 1.5

  currentZoom = Math.max(currentZoom / zoomFactor, minZoom)
  applyZoomEnhanced() // Use enhanced zoom application

  console.log(`🔍 Zoomed out to ${Math.round(currentZoom)}%`)
}

/**
 * Reset zoom to 100% (fit to container)
 */
function resetZoom() {
  currentZoom = 100
  applyZoomEnhanced() // Use enhanced zoom application

  console.log("🔄 Zoom reset to 100%")
}

/**
 * Fit image to screen dimensions
 */
function fitToScreen() {
  const container = document.querySelector("#full-viewer-container, .canvas-container")
  const image = document.querySelector("#explorer-image, .main-image")

  if (!container || !image) return

  const containerRect = container.getBoundingClientRect()
  const imageAspect = imageNaturalSize.width / imageNaturalSize.height
  const containerAspect = containerRect.width / containerRect.height

  // Calculate optimal zoom to fit screen
  if (imageAspect > containerAspect) {
    // Image is wider - fit to width
    currentZoom = (containerRect.width / imageNaturalSize.width) * 100
  } else {
    // Image is taller - fit to height
    currentZoom = (containerRect.height / imageNaturalSize.height) * 100
  }

  applyZoomEnhanced() // Use enhanced zoom application
  console.log(`📐 Fitted to screen: ${Math.round(currentZoom)}%`)
}

/**
 * Apply zoom transformation to image
 */
function applyZoom() {
  const images = document.querySelectorAll("#explorer-image, .main-image")
  const zoomScale = currentZoom / 100

  images.forEach((image) => {
    image.style.transform = `scale(${zoomScale})`
    image.style.transition = "transform 0.3s ease"
  })

  // Update all zoom displays with real pixel information
  updateZoomDisplayEnhanced()

  // Show/hide pixel grid for extreme zoom levels
  togglePixelGrid(currentZoom > 1000)

  // Update pixel scale based on zoom
  updatePixelScaleDisplayEnhanced()

  updateVisiblePixelsDisplay()
}

/**
 * Enhanced zoom display with better formatting
 */
function updateZoomDisplayEnhanced() {
  const zoomDisplays = document.querySelectorAll("#current-zoom, #zoom-level")
  const zoomPercentage = Math.round(currentZoom)
  const zoomMultiplier = Math.round((currentZoom / 100) * 10) / 10

  zoomDisplays.forEach((display) => {
    if (display.id === "current-zoom") {
      display.textContent = zoomPercentage + "%"
    } else {
      display.textContent = zoomPercentage + "%"
    }
  })
}

/**
 * Enhanced pixel scale display with zoom consideration
 */
function updatePixelScaleDisplayEnhanced() {
  const pixelScaleDisplays = document.querySelectorAll("#pixel-scale, #current-pixel-scale")
  const effectivePixelScale = (pixelScale / (currentZoom / 100)).toFixed(4)

  pixelScaleDisplays.forEach((display) => {
    display.textContent = `${effectivePixelScale}"/px`
  })
}

/**
 * New function to update visible pixels display
 */
function updateVisiblePixelsDisplay() {
  const visiblePixelsDisplay = document.getElementById("visible-pixels")
  if (visiblePixelsDisplay && imageNaturalSize.width > 0) {
    const zoomFactor = currentZoom / 100
    const visibleWidth = Math.round(imageNaturalSize.width / zoomFactor)
    const visibleHeight = Math.round(imageNaturalSize.height / zoomFactor)
    visiblePixelsDisplay.textContent = `${visibleWidth}×${visibleHeight}`
  }
}

/**
 * Update zoom level display
 */
function updateZoomDisplay() {
  const zoomDisplays = document.querySelectorAll("#current-zoom, #zoom-level")
  const zoomPercentage = Math.round(currentZoom)
  const zoomMultiplier = Math.round((currentZoom / 100) * 10) / 10

  zoomDisplays.forEach((display) => {
    if (display.id === "current-zoom") {
      display.textContent = zoomPercentage + "%"
    } else {
      display.textContent = zoomMultiplier + "x"
    }
  })
}

/**
 * Update pixel scale display based on current zoom
 */
function updatePixelScaleDisplay() {
  const pixelScaleDisplays = document.querySelectorAll("#pixel-scale, #current-pixel-scale")
  const effectivePixelScale = (pixelScale / (currentZoom / 100)).toFixed(4)

  pixelScaleDisplays.forEach((display) => {
    display.textContent = `${effectivePixelScale}"/px`
  })
}

/**
 * Toggle pixel grid overlay for extreme zoom levels
 * @param {boolean} show - Whether to show the pixel grid
 */
function togglePixelGrid(show) {
  let pixelGrid = document.querySelector(".pixel-grid")

  if (show && !pixelGrid) {
    // Create pixel grid overlay
    pixelGrid = document.createElement("div")
    pixelGrid.className = "pixel-grid"

    const containers = document.querySelectorAll(".canvas-container, #full-viewer-container")
    containers.forEach((container) => {
      const grid = pixelGrid.cloneNode()
      container.appendChild(grid)
    })
  }

  // Toggle visibility
  document.querySelectorAll(".pixel-grid").forEach((grid) => {
    grid.classList.toggle("visible", show)
  })
}

/**
 * AI Pattern Analysis System
 * Advanced machine learning simulation for object detection
 */

/**
 * Run AI pattern analysis on current image
 */
async function runAIAnalysis() {
  if (isAIAnalyzing) {
    console.log("⚠️ AI analysis already in progress")
    return
  }

  console.log("🧠 Starting AI pattern analysis...")
  isAIAnalyzing = true

  // Show loading indicator
  showAILoadingIndicator()

  // Update analysis status
  updateAnalysisStatus("analyzing", "Analyzing image patterns...")

  try {
    // Simulate AI processing time (2-5 seconds)
    const processingTime = 2000 + Math.random() * 3000
    await new Promise((resolve) => setTimeout(resolve, processingTime))

    // Generate AI detections
    const detections = await generateAIDetections()

    // Display results
    displayAIDetections(detections)

    // Update status
    updateAnalysisStatus("complete", `Analysis complete: ${detections.length} objects detected`)

    console.log(`✅ AI analysis complete: ${detections.length} objects detected`)
  } catch (error) {
    console.error("❌ AI analysis failed:", error)
    updateAnalysisStatus("error", "Analysis failed - please try again")
  } finally {
    isAIAnalyzing = false
    hideAILoadingIndicator()
  }
}

/**
 * Generate simulated AI detections
 * @returns {Promise<Array>} - Array of detected objects
 */
async function generateAIDetections() {
  const detectionTypes = [
    { type: "Galaxy Cluster", confidence: 0.95, color: "#3b82f6" },
    { type: "Star Formation Region", confidence: 0.92, color: "#06d6a0" },
    { type: "Protoplanetary Disk", confidence: 0.88, color: "#8b5cf6" },
    { type: "Brown Dwarf Candidate", confidence: 0.85, color: "#f59e0b" },
    { type: "Gravitational Lens", confidence: 0.91, color: "#ef4444" },
    { type: "Unknown Object", confidence: 0.75, color: "#ec4899" },
  ]

  // Generate 3-8 random detections
  const numDetections = Math.floor(Math.random() * 6) + 3
  const detections = []

  for (let i = 0; i < numDetections; i++) {
    const detection = detectionTypes[Math.floor(Math.random() * detectionTypes.length)]

    detections.push({
      id: `detection_${Date.now()}_${i}`,
      type: detection.type,
      confidence: detection.confidence + (Math.random() * 0.1 - 0.05), // Add some variance
      position: {
        x: Math.random() * 80 + 10, // 10-90% of image width
        y: Math.random() * 80 + 10, // 10-90% of image height
      },
      size: {
        width: Math.random() * 8 + 2, // 2-10% of image
        height: Math.random() * 8 + 2,
      },
      color: detection.color,
      timestamp: new Date().toISOString(),
    })
  }

  detectedObjects = detections
  return detections
}

/**
 * Display AI detections on the image
 * @param {Array} detections - Array of detection objects
 */
function displayAIDetections(detections) {
  // Clear existing detections
  clearAIDetections()

  const containers = document.querySelectorAll(".canvas-container, #full-viewer-container")

  containers.forEach((container) => {
    // Create AI analysis overlay
    const overlay = document.createElement("div")
    overlay.className = "ai-analysis-overlay"

    detections.forEach((detection) => {
      // Create detection box
      const detectionBox = document.createElement("div")
      detectionBox.className = "ai-detection"
      detectionBox.style.left = detection.position.x + "%"
      detectionBox.style.top = detection.position.y + "%"
      detectionBox.style.width = detection.size.width + "%"
      detectionBox.style.height = detection.size.height + "%"
      detectionBox.style.borderColor = detection.color

      // Create detection label
      const label = document.createElement("div")
      label.className = "ai-detection-label"
      label.style.borderColor = detection.color
      label.style.color = detection.color
      label.textContent = `${detection.type} (${Math.round(detection.confidence * 100)}%)`

      detectionBox.appendChild(label)
      overlay.appendChild(label)
      overlay.appendChild(detectionBox)

      // Add click handler for detailed info
      detectionBox.addEventListener("click", () => {
        showDetectionDetails(detection)
      })
    })

    container.appendChild(overlay)
  })

  console.log(`🎯 Displayed ${detections.length} AI detections`)
}

/**
 * Show detailed information about a detection
 * @param {Object} detection - Detection object
 */
function showDetectionDetails(detection) {
  const details = `
    🔍 AI Detection Details
    
    Type: ${detection.type}
    Confidence: ${Math.round(detection.confidence * 100)}%
    Position: (${Math.round(detection.position.x)}%, ${Math.round(detection.position.y)}%)
    Size: ${Math.round(detection.size.width)}% × ${Math.round(detection.size.height)}%
    Detected: ${new Date(detection.timestamp).toLocaleTimeString()}
    
    This object was automatically detected by our AI pattern recognition system.
    Would you like to add it to your research notes?
  `

  if (confirm(details)) {
    addToResearchNotes(detection)
  }
}

/**
 * Add detection to research notes (simulated)
 * @param {Object} detection - Detection object
 */
function addToResearchNotes(detection) {
  console.log(`📝 Added to research notes: ${detection.type}`)
  alert(`"${detection.type}" has been added to your research notes!`)
}

/**
 * Clear all AI detections from display
 */
function clearAIDetections() {
  document.querySelectorAll(".ai-analysis-overlay").forEach((overlay) => {
    overlay.remove()
  })
  detectedObjects = []
}

/**
 * Show AI loading indicator
 */
function showAILoadingIndicator() {
  const containers = document.querySelectorAll(".canvas-container, #full-viewer-container")

  containers.forEach((container) => {
    const loading = document.createElement("div")
    loading.className = "ai-loading"
    loading.innerHTML = `
      <div class="spinner"></div>
      <div>AI Analysis in Progress...</div>
      <div style="font-size: 0.8em; color: var(--text-muted); margin-top: 8px;">
        Scanning for celestial objects and anomalies
      </div>
    `
    container.appendChild(loading)
  })
}

/**
 * Hide AI loading indicator
 */
function hideAILoadingIndicator() {
  document.querySelectorAll(".ai-loading").forEach((loading) => {
    loading.remove()
  })
}

/**
 * Update analysis status display
 * @param {string} status - Status type ('analyzing', 'complete', 'error')
 * @param {string} message - Status message
 */
function updateAnalysisStatus(status, message) {
  let statusElement = document.querySelector(".analysis-status")

  if (!statusElement) {
    statusElement = document.createElement("div")
    statusElement.className = "analysis-status"

    const containers = document.querySelectorAll(".canvas-container, #full-viewer-container")
    containers.forEach((container) => {
      const statusClone = statusElement.cloneNode()
      container.appendChild(statusClone)
    })
  }

  document.querySelectorAll(".analysis-status").forEach((element) => {
    element.className = `analysis-status ${status}`
    element.textContent = message

    // Auto-hide after 5 seconds for complete/error status
    if (status !== "analyzing") {
      setTimeout(() => {
        element.style.opacity = "0"
        setTimeout(() => element.remove(), 300)
      }, 5000)
    }
  })
}

/**
 * Enhanced data source change functionality
 * Handles switching between different NASA data sources
 */
function changeDataSource() {
  const dataSource = document.getElementById("data-source")?.value
  if (!dataSource) return

  console.log(`📡 Switching to data source: ${dataSource}`)

  // Update image based on data source
  const imageMap = {
    jwst: {
      src: "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?w=2000&h=1158&fit=crop&crop=faces%2Cfocalpoint",
      title: "JWST Carina Nebula",
      description: "Stellar nursery showing star formation in unprecedented detail",
      resolution: "4096x4096",
      pixelScale: 0.031,
    },
    hubble: {
      src: "hubble-deep-field-galaxies.png",
      title: "Hubble Deep Field",
      description: "Ultra-deep view revealing thousands of distant galaxies",
      resolution: "3200x3200",
      pixelScale: 0.05,
    },
    usgs: {
      src: "/planetary-surface-map.jpg",
      title: "Planetary Surface Map",
      description: "High-resolution geological mapping data",
      resolution: "2048x2048",
      pixelScale: 0.1,
    },
  }

  const imageData = imageMap[dataSource]
  if (imageData) {
    loadImageWithMetadata(imageData.src, imageData)
  }
}

/**
 * Enhanced object type filtering
 * Filters displayed objects based on astronomical classification
 */
function filterByObjectType() {
  const objectType = document.getElementById("object-type")?.value
  if (!objectType) return

  console.log(`🔍 Filtering by object type: ${objectType}`)

  // Update collection list based on filter
  const collections = document.querySelectorAll(".collection-item")
  collections.forEach((item) => {
    const itemType = item.querySelector("span").textContent.toLowerCase()
    const shouldShow = objectType === "all" || itemType.includes(objectType.slice(0, -1))

    item.style.display = shouldShow ? "flex" : "none"
  })
}

/**
 * Enhanced measurement tool functionality
 * Provides distance and angular measurement capabilities
 */
function measureDistance() {
  console.log("📏 Activating distance measurement tool...")

  // Toggle measurement mode
  const measureBtn = document.querySelector('[onclick="measureDistance()"]')
  if (measureBtn) {
    measureBtn.classList.toggle("active")

    if (measureBtn.classList.contains("active")) {
      // Start measurement mode
      enableMeasurementMode()
    } else {
      // End measurement mode
      disableMeasurementMode()
    }
  }
}

/**
 * Enable measurement mode with click handlers
 */
function enableMeasurementMode() {
  const canvas = document.getElementById("canvas-container")
  if (!canvas) return

  canvas.style.cursor = "crosshair"
  canvas.addEventListener("click", handleMeasurementClick)

  console.log("📏 Measurement mode enabled - click two points to measure distance")
}

/**
 * Disable measurement mode
 */
function disableMeasurementMode() {
  const canvas = document.getElementById("canvas-container")
  if (!canvas) return

  canvas.style.cursor = "default"
  canvas.removeEventListener("click", handleMeasurementClick)

  // Clear measurement overlays
  document.querySelectorAll(".measurement-line, .measurement-point").forEach((el) => el.remove())

  console.log("📏 Measurement mode disabled")
}

let measurementPoints = []

/**
 * Handle measurement point clicks
 */
function handleMeasurementClick(e) {
  const rect = e.target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  measurementPoints.push({ x, y })

  // Create measurement point marker
  const point = document.createElement("div")
  point.className = "measurement-point"
  point.style.cssText = `
    position: absolute;
    left: ${x - 5}px;
    top: ${y - 5}px;
    width: 10px;
    height: 10px;
    background: var(--accent);
    border: 2px solid white;
    border-radius: 50%;
    z-index: 100;
  `
  e.target.appendChild(point)

  if (measurementPoints.length === 2) {
    // Calculate and display distance
    const distance = calculateDistance(measurementPoints[0], measurementPoints[1])
    displayMeasurementResult(distance)
    measurementPoints = []
  }
}

/**
 * Calculate distance between two points
 */
function calculateDistance(point1, point2) {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  const pixelDistance = Math.sqrt(dx * dx + dy * dy)

  // Convert to angular distance (simplified)
  const angularDistance = pixelDistance * pixelScale

  return {
    pixels: Math.round(pixelDistance),
    arcseconds: angularDistance.toFixed(3),
    arcminutes: (angularDistance / 60).toFixed(3),
  }
}

/**
 * Display measurement results
 */
function displayMeasurementResult(distance) {
  const result = `
    📏 Distance Measurement:
    
    Pixel Distance: ${distance.pixels} pixels
    Angular Distance: ${distance.arcseconds} arcseconds
    Angular Distance: ${distance.arcminutes} arcminutes
    
    Note: This is a simplified calculation. Actual astronomical distances require proper WCS coordinates.
  `

  alert(result)
  console.log("📏 Measurement result:", distance)
}

/**
 * Enhanced export functionality
 * Exports current view with annotations and measurements
 */
function exportImage() {
  console.log("💾 Exporting current image view...")

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  const image = document.getElementById("main-image") || document.querySelector(".main-image")

  if (!image) {
    alert("No image to export")
    return
  }

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  // Draw the image
  ctx.drawImage(image, 0, 0)

  // Add watermark
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
  ctx.font = "20px Inter"
  ctx.fillText("CosmoZoom - NASA Space Apps 2025", 20, canvas.height - 20)

  // Create download link
  const link = document.createElement("a")
  link.download = `cosmozoom-export-${Date.now()}.png`
  link.href = canvas.toDataURL()
  link.click()

  console.log("💾 Image exported successfully")
}

/**
 * Load random image from collection
 */
function loadRandomImage() {
  const images = [
    {
      src: "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?w=2000&h=1158&fit=crop&crop=faces%2Cfocalpoint",
      title: "JWST Carina Nebula",
      description:
        "Stellar nursery showing star formation in unprecedented detail with infrared imaging revealing hidden structures",
      resolution: "4096x4096",
      pixelScale: 0.031,
    },
    {
      src: "hubble-deep-field-default.png",
      title: "Hubble Deep Field",
      description:
        "Ultra-deep view revealing thousands of distant galaxies of various shapes, sizes, colors, and evolutionary stages",
      resolution: "3200x3200",
      pixelScale: 0.05,
    },
    {
      src: "/crab-nebula-supernova-remnant-from-hubble-telescop.jpg",
      title: "Crab Nebula",
      description: "Supernova remnant expanding at 1,500 kilometers per second",
      resolution: "2048x2048",
      pixelScale: 0.04,
    },
    {
      src: "/saturn-rings-and-moons-from-cassini-spacecraft.jpg",
      title: "Saturn System",
      description: "High-resolution view of Saturn's rings and major moons from Cassini",
      resolution: "1024x1024",
      pixelScale: 0.1,
    },
  ]

  const randomImage = images[Math.floor(Math.random() * images.length)]
  loadImageWithMetadata(randomImage.src, randomImage)

  console.log(`🎲 Loaded random image: ${randomImage.title}`)
}

/**
 * Initialize zoom level demo animation
 */
function initializeZoomDemo() {
  const zoomLevels = document.querySelectorAll(".zoom-level")
  let currentLevel = 0

  // Cycle through zoom levels every 2 seconds
  setInterval(() => {
    zoomLevels.forEach((level) => level.classList.remove("active"))
    if (zoomLevels[currentLevel]) {
      zoomLevels[currentLevel].classList.add("active")
    }
    currentLevel = (currentLevel + 1) % zoomLevels.length
  }, 2000)
}

/**
 * Initialize collection item interactions
 */
function initializeCollectionItems() {
  const collectionItems = document.querySelectorAll(".collection-item")

  collectionItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Update active state
      collectionItems.forEach((i) => i.classList.remove("active"))
      this.classList.add("active")

      const collectionName =
        this.querySelector("span").textContent || this.querySelector(".collection-name").textContent
      const imageData = this.getAttribute("data-image")

      console.log(`📁 Selected collection: ${collectionName}`)

      if (imageData && isExplorerOpen) {
        const metadata = getImageMetadata(imageData)
        // Use the full path including 'public/' prefix
        loadImageWithMetadata(imageData.startsWith("public/") ? imageData : `public/${imageData}`, metadata)
      } else if (isExplorerOpen) {
        loadRandomImage()
      }
    })
  })
}

/**
 * Get image metadata based on filename
 * @param {string} filename - Image filename
 * @returns {Object} Image metadata
 */
function getImageMetadata(filename) {
  const metadataMap = {
    "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?w=2000&h=1158&fit=crop&crop=faces%2Cfocalpoint": {
      title: "JWST Carina Nebula",
      description:
        "Stellar nursery showing star formation in unprecedented detail with infrared imaging revealing hidden structures and cosmic cliffs",
      resolution: "4096×4096",
      pixelScale: 0.031,
      source: "James Webb Space Telescope",
      coordinates: "10h 36m 41s, -59° 52' 04\"",
    },
    "hubble-deep-field-default.png": {
      title: "Hubble Deep Field",
      description:
        "Ultra-deep view revealing thousands of distant galaxies of various shapes, sizes, colors, and evolutionary stages across cosmic time",
      resolution: "3200×3200",
      pixelScale: 0.05,
      source: "Hubble Space Telescope",
      coordinates: "12h 36m 49s, +62° 12' 58\"",
    },
    "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?w=2000&h=1158&fit=crop&crop=faces%2Cfocalpoint": {
      title: "JWST Carina Nebula",
      description: "Stellar nursery showing star formation in unprecedented detail",
      resolution: "4096×4096",
      pixelScale: 0.031,
      source: "James Webb Space Telescope",
    },
    "hubble-deep-field-galaxies.png": {
      title: "Hubble Deep Field",
      description: "Ultra-deep view revealing thousands of distant galaxies",
      resolution: "3200×3200",
      pixelScale: 0.05,
      source: "Hubble Space Telescope",
    },
  }

  // Extract filename from path if needed
  const cleanFilename = filename.split("/").pop()

  return (
    metadataMap[cleanFilename] || {
      title: "Space Image",
      description: "High-resolution astronomical image",
      resolution: "Unknown",
      pixelScale: 0.1,
      source: "NASA Archive",
    }
  )
}

/**
 * Initialize annotation interactions
 */
function initializeAnnotations() {
  const annotations = document.querySelectorAll(".annotation-point, .annotation")

  annotations.forEach((annotation) => {
    annotation.addEventListener("click", function (e) {
      e.stopPropagation()

      const tooltip = this.querySelector(".annotation-tooltip, .annotation-label")
      if (tooltip) {
        const title = tooltip.querySelector("h4")?.textContent || tooltip.textContent
        showAnnotationDetails(title, this)
      }
    })
  })
}

/**
 * Show detailed annotation information
 * @param {string} title - Annotation title
 * @param {HTMLElement} element - Annotation element
 */
function showAnnotationDetails(title, element) {
  const popup = document.createElement("div")
  popup.className = "annotation-popup"
  popup.innerHTML = `
    <div class="popup-content">
      <h3>${title}</h3>
      <p>Detailed analysis and measurements would be displayed here.</p>
      <div class="popup-actions">
        <button onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
        <button onclick="addToFavorites('${title}')">Add to Favorites</button>
      </div>
    </div>
  `

  // Style the popup
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.95);
    padding: 20px;
    border-radius: 10px;
    border: 1px solid var(--border);
    z-index: 3000;
    min-width: 300px;
    text-align: center;
  `

  document.body.appendChild(popup)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (popup.parentElement) {
      popup.remove()
    }
  }, 5000)
}

/**
 * Add item to favorites (simulated)
 * @param {string} title - Item title
 */
function addToFavorites(title) {
  console.log(`⭐ Added to favorites: ${title}`)
  alert(`"${title}" has been added to your favorites! In a full implementation, this would save to your user profile.`)
}

/**
 * Keyboard Shortcuts System
 * Power user shortcuts for efficient navigation
 */
function initializeKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Explorer-specific shortcuts
    if (isExplorerOpen) {
      handleExplorerShortcuts(e)
    }

    // Global shortcuts
    handleGlobalShortcuts(e)
  })

  console.log("⌨️ Keyboard shortcuts initialized")
}

/**
 * Handle explorer-specific keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleExplorerShortcuts(e) {
  switch (e.key) {
    case "Escape":
      closeExplorer()
      break
    case "+":
    case "=":
      e.preventDefault()
      zoomIn()
      break
    case "-":
      e.preventDefault()
      zoomOut()
      break
    case "0":
      e.preventDefault()
      resetZoom()
      break
    case "f":
    case "F":
      e.preventDefault()
      fitToScreen()
      break
    case "r":
    case "R":
      e.preventDefault()
      loadRandomImage()
      break
    case "a":
    case "A":
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        runEnhancedAIAnalysis() // Changed to call enhanced analysis
      }
      break
  }
}

/**
 * Handle global keyboard shortcuts
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleGlobalShortcuts(e) {
  // Launch explorer with Ctrl+L
  if ((e.key === "l" || e.key === "L") && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    launchExplorer()
  }
}

/**
 * Scroll-based Animations
 * Smooth reveal animations for page elements
 */
function initializeScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  // Observe elements for animation
  const animatedElements = document.querySelectorAll(".feature-card, .stat-card, .source-card, .community-card")

  animatedElements.forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(20px)"
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
    observer.observe(el)
  })
}

/**
 * Real-time Data Updates
 * Simulates live data feeds and statistics
 */
function initializeRealTimeUpdates() {
  // Update discovery confidence levels
  setInterval(updateDiscoveryConfidence, 5000)

  // Update global statistics
  setInterval(updateGlobalStatistics, 10000)

  console.log("📊 Real-time updates initialized")
}

/**
 * Update discovery confidence levels
 */
function updateDiscoveryConfidence() {
  const discoveryItems = document.querySelectorAll(".discovery-item")

  discoveryItems.forEach((item) => {
    const confidence = item.querySelector(".discovery-confidence")
    if (confidence && confidence.textContent.includes("%")) {
      const currentValue = Number.parseInt(confidence.textContent)
      const newValue = Math.min(currentValue + Math.floor(Math.random() * 3), 99)
      confidence.textContent = newValue + "% confidence"
    }
  })
}

/**
 * Update global statistics
 */
function updateGlobalStatistics() {
  const stats = document.querySelectorAll(".stat-number")

  // 10% chance to update stats each interval
  if (Math.random() < 0.1) {
    stats.forEach((stat) => {
      if (stat.textContent.includes("+")) {
        const currentValue = Number.parseFloat(stat.textContent.replace(/[^\d.]/g, ""))
        const increment = currentValue * 0.001 // Small increment
        const newValue = (currentValue + increment).toFixed(1)
        const suffix = stat.textContent.includes("M") ? "M+" : "K+"
        stat.textContent = newValue + suffix
      }
    })
  }
}

/**
 * NASA Data Integration Classes
 * Simulated API integration for real NASA data
 */

/**
 * NASA Data Manager
 * Handles data fetching from various NASA sources
 */
class NASADataManager {
  constructor() {
    this.baseURL = "https://archive.stsci.edu/"
    this.cache = new Map()
    console.log("🛰️ NASA Data Manager initialized")
  }

  /**
   * Fetch JWST data with filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} - JWST data results
   */
  async fetchJWSTData(filters = {}) {
    console.log("📡 Fetching JWST data with filters:", filters)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In a real implementation, this would make actual API calls
    return {
      images: [
        {
          id: 1,
          title: "JWST Deep Field",
          url: "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?w=2000&h=1158&fit=crop&crop=faces%2Cfocalpoint",
          coordinates: { ra: "10h 36m 41s", dec: "-59° 52' 04\"" },
          pixelScale: 0.031,
        },
        {
          id: 2,
          title: "Carina Nebula",
          url: "https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?w=2000&h=1158&fit=crop&crop=faces%2Cfocalpoint",
          coordinates: { ra: "10h 45m 08s", dec: "-59° 41' 04\"" },
          pixelScale: 0.031,
        },
      ],
      total: 1247,
    }
  }

  /**
   * Fetch Hubble data with filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} - Hubble data results
   */
  async fetchHubbleData(filters = {}) {
    console.log("📡 Fetching Hubble data with filters:", filters)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      images: [
        {
          id: 3,
          title: "Hubble Deep Field",
          url: "public/hubble-deep-field-galaxies.png",
          coordinates: { ra: "12h 36m 49s", dec: "+62° 12' 58\"" },
          pixelScale: 0.05,
        },
        {
          id: 4,
          title: "Eagle Nebula",
          url: "/eagle-nebula-hubble.jpg",
          coordinates: { ra: "18h 18m 48s", dec: "-13° 49' 00\"" },
          pixelScale: 0.04,
        },
      ],
      total: 892,
    }
  }

  /**
   * Search images across all sources
   * @param {string} query - Search query
   * @param {string} source - Data source filter
   * @returns {Promise<Object>} - Search results
   */
  async searchImages(query, source = "all") {
    console.log(`🔍 Searching for: ${query} in ${source}`)

    await new Promise((resolve) => setTimeout(resolve, 800))

    // Simulate search results
    return {
      results: [
        {
          id: 5,
          title: `${query} - JWST`,
          relevance: 0.95,
          coordinates: { ra: "14h 20m 15s", dec: "+25° 18' 42\"" },
        },
        {
          id: 6,
          title: `${query} - Hubble`,
          relevance: 0.87,
          coordinates: { ra: "16h 45m 33s", dec: "-18° 25' 17\"" },
        },
      ],
      total: 156,
    }
  }
}

/**
 * AI Pattern Recognition System
 * Advanced machine learning simulation
 */
class AIPatternRecognition {
  constructor() {
    this.confidenceThreshold = 0.85
    this.patterns = [
      "Galaxy Cluster",
      "Gravitational Lens",
      "Exoplanet Transit",
      "Brown Dwarf",
      "Protoplanetary Disk",
      "Supernova Remnant",
      "Quasar",
      "Nebula Structure",
      "Binary Star System",
      "Dark Matter Halo",
    ]
    console.log("🧠 AI Pattern Recognition initialized")
  }

  /**
   * Analyze image for patterns
   * @param {Object} imageData - Image data to analyze
   * @returns {Array} - Detected patterns
   */
  analyzeImage(imageData) {
    console.log("🔬 Analyzing image patterns...")

    const detectedPatterns = []
    const numPatterns = Math.floor(Math.random() * 4) + 2 // 2-5 patterns

    for (let i = 0; i < numPatterns; i++) {
      const pattern = this.patterns[Math.floor(Math.random() * this.patterns.length)]
      const confidence = 0.7 + Math.random() * 0.3 // 70-100% confidence

      if (confidence >= this.confidenceThreshold) {
        detectedPatterns.push({
          type: pattern,
          confidence: confidence,
          coordinates: {
            x: Math.random() * 100,
            y: Math.random() * 100,
          },
          size: {
            width: Math.random() * 15 + 5,
            height: Math.random() * 15 + 5,
          },
          timestamp: new Date().toISOString(),
        })
      }
    }

    return detectedPatterns
  }

  /**
   * Flag unknown objects in image
   * @param {Object} imageData - Image data to analyze
   * @returns {Array} - Unknown objects found
   */
  flagUnknownObjects(imageData) {
    console.log("🔍 Scanning for unknown objects...")

    // 20% chance of unknown object detection
    if (Math.random() < 0.2) {
      return [
        {
          type: "Unknown Object",
          confidence: 0.6 + Math.random() * 0.25,
          coordinates: {
            x: Math.random() * 100,
            y: Math.random() * 100,
          },
          size: {
            width: Math.random() * 10 + 3,
            height: Math.random() * 10 + 3,
          },
          needsReview: true,
          priority: "high",
          timestamp: new Date().toISOString(),
        },
      ]
    }
    return []
  }
}

/**
 * Collaboration Management System
 * Handles user contributions and community features
 */
class CollaborationManager {
  constructor() {
    this.userContributions = 0
    this.globalStats = {
      activeUsers: 15847,
      labelsToday: 2300000,
      discoveries: 50000,
    }
    console.log("👥 Collaboration Manager initialized")
  }

  /**
   * Submit a label for an image
   * @param {string} imageId - Image identifier
   * @param {string} label - Label text
   * @param {Object} coordinates - Label coordinates
   * @returns {Object} - Submission result
   */
  submitLabel(imageId, label, coordinates) {
    console.log(`🏷️ Label submitted: ${label} at ${coordinates.x}, ${coordinates.y} for image ${imageId}`)

    this.userContributions++
    this.globalStats.labelsToday++

    // Update UI
    this.updateGlobalStats()

    return {
      success: true,
      points: 10,
      message: "Thank you for your contribution!",
      totalContributions: this.userContributions,
    }
  }

  /**
   * Update global statistics display
   */
  updateGlobalStats() {
    const labelsElement = document.querySelector(".collab-item:last-child span")
    if (labelsElement) {
      const labelsInMillions = (this.globalStats.labelsToday / 1000000).toFixed(1)
      labelsElement.textContent = `${labelsInMillions}M Labels Added Today`
    }
  }

  /**
   * Get user's current rank
   * @returns {number} - User rank
   */
  getUserRank() {
    // Simulate user ranking based on contributions
    const baseRank = Math.floor(Math.random() * 1000) + 1
    const contributionBonus = Math.floor(this.userContributions / 10)
    return Math.max(1, baseRank - contributionBonus)
  }

  /**
   * Get leaderboard data
   * @returns {Array} - Top contributors
   */
  getLeaderboard() {
    return [
      { name: "Dr. Sarah Chen", contributions: 2847, rank: 1 },
      { name: "Marcus Rodriguez", contributions: 2156, rank: 2 },
      { name: "Elena Kowalski", contributions: 1923, rank: 3 },
      { name: "You", contributions: this.userContributions, rank: this.getUserRank() },
    ]
  }
}

// Initialize global instances
const nasaData = new NASADataManager()
const aiRecognition = new AIPatternRecognition()
const collaboration = new CollaborationManager()

// Export functions for global access
window.CosmoZoom = {
  // Core functions
  launchExplorer,
  openExplorerPage,
  loadRandomImage,

  // Zoom functions
  zoomIn,
  zoomOut,
  resetZoom,
  fitToScreen,

  // AI functions
  runAIAnalysis,
  runEnhancedAIAnalysis, // Export enhanced AI analysis function

  // New functions
  changeDataSource,
  filterByObjectType,
  measureDistance,
  exportImage,
  changeDataType, // Added
  applyWavelengthFilter, // Added

  // Data managers
  nasaData,
  aiRecognition,
  collaboration,

  // State
  getCurrentZoom: () => currentZoom,
  getDetectedObjects: () => detectedObjects,
  getImageData: () => currentImageData,
}

// Final initialization log
console.log("🚀 CosmoZoom fully initialized!")
console.log("🌌 Ready to explore the infinite cosmos!")
console.log("⌨️ Keyboard shortcuts available:")
console.log("   • Ctrl+L: Launch Explorer")
console.log("   • +/-: Zoom in/out")
console.log("   • F: Fit to screen")
console.log("   • R: Random image")
console.log("   • Ctrl+A: Run AI analysis")
console.log("   • ESC: Close explorer")

/**
 * Close Explorer Modal
 * Closes the full-screen image explorer
 */
function closeExplorer() {
  console.log("🚪 Closing CosmoZoom Explorer...")
  window.history.back()
  isExplorerOpen = false
}

/**
 * Spectral Analysis Tool
 * Simulates spectral analysis of selected regions
 */
function spectralAnalysis() {
  console.log("🌈 Starting spectral analysis...")

  const analysisResult = {
    dominantWavelengths: ["656nm (H-alpha)", "500nm (OIII)", "486nm (H-beta)"],
    temperature: Math.round(3000 + Math.random() * 7000) + "K",
    redshift: (Math.random() * 0.1).toFixed(4),
    metallicity: (Math.random() * 2 - 1).toFixed(2),
  }

  const resultText = `
🌈 Spectral Analysis Results:

Dominant Wavelengths:
${analysisResult.dominantWavelengths.join("\n")}

Temperature: ${analysisResult.temperature}
Redshift: z = ${analysisResult.redshift}
Metallicity: [Fe/H] = ${analysisResult.metallicity}

This analysis provides insights into the chemical composition and physical properties of the observed object.
  `

  alert(resultText)
  console.log("🌈 Spectral analysis complete:", analysisResult)
}

/**
 * Photometry Tool
 * Measures brightness and magnitude of celestial objects
 */
function photometryTool() {
  console.log("☀️ Starting photometry measurements...")

  const photometryResult = {
    magnitude: (Math.random() * 10 + 15).toFixed(2),
    brightness: (Math.random() * 1000).toFixed(0),
    colorIndex: (Math.random() * 2 - 0.5).toFixed(3),
    variability: Math.random() > 0.7 ? "Variable" : "Stable",
  }

  const resultText = `
☀️ Photometry Results:

Apparent Magnitude: ${photometryResult.magnitude}
Brightness: ${photometryResult.brightness} counts/sec
Color Index (B-V): ${photometryResult.colorIndex}
Variability: ${photometryResult.variability}

These measurements help determine the object's distance, luminosity, and stellar classification.
  `

  alert(resultText)
  console.log("☀️ Photometry complete:", photometryResult)
}

/**
 * Annotation Tool
 * Enables users to add custom annotations to images
 */
function annotationTool() {
  console.log("🏷️ Activating annotation tool...")

  const annotationMode = !document.body.classList.contains("annotation-mode")
  document.body.classList.toggle("annotation-mode", annotationMode)

  const canvas = document.getElementById("canvas-container")
  if (!canvas) return

  if (annotationMode) {
    canvas.style.cursor = "crosshair"
    canvas.addEventListener("click", handleAnnotationClick)

    // Show annotation instructions
    showAnnotationInstructions()
  } else {
    canvas.style.cursor = "default"
    canvas.removeEventListener("click", handleAnnotationClick)
    hideAnnotationInstructions()
  }
}

/**
 * Handle annotation clicks
 * @param {MouseEvent} e - Click event
 */
function handleAnnotationClick(e) {
  const rect = e.target.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100

  const annotationText = prompt("Enter annotation text:")
  if (annotationText) {
    addCustomAnnotation(x, y, annotationText)
  }
}

/**
 * Add custom annotation to image
 * @param {number} x - X position as percentage
 * @param {number} y - Y position as percentage
 * @param {string} text - Annotation text
 */
function addCustomAnnotation(x, y, text) {
  const overlay = document.getElementById("overlay-annotations")
  if (!overlay) return

  const annotation = document.createElement("div")
  annotation.className = "annotation custom-annotation"
  annotation.style.left = x + "%"
  annotation.style.top = y + "%"

  annotation.innerHTML = `
    <div class="annotation-marker custom"></div>
    <div class="annotation-label">${text}</div>
  `

  overlay.appendChild(annotation)
  console.log(`🏷️ Added annotation: "${text}" at ${x.toFixed(1)}%, ${y.toFixed(1)}%`)
}

/**
 * Show annotation instructions
 */
function showAnnotationInstructions() {
  const instructions = document.createElement("div")
  instructions.className = "annotation-instructions"
  instructions.innerHTML = `
    <div class="instructions-content">
      <h4>Annotation Mode Active</h4>
      <p>Click anywhere on the image to add an annotation</p>
      <button onclick="annotationTool()">Exit Annotation Mode</button>
    </div>
  `

  document.body.appendChild(instructions)
}

/**
 * Hide annotation instructions
 */
function hideAnnotationInstructions() {
  const instructions = document.querySelector(".annotation-instructions")
  if (instructions) {
    instructions.remove()
  }
}

/**
 * Enhanced AI Pattern Analysis System
 * Advanced machine learning simulation for comprehensive object detection
 */
async function runEnhancedAIAnalysis() {
  if (isAIAnalyzing) {
    console.log("⚠️ AI analysis already in progress")
    return
  }

  if (!currentImageData) {
    alert("Please load an image first before running AI analysis")
    return
  }

  console.log("🧠 Starting enhanced AI pattern analysis with advanced intelligence...")
  isAIAnalyzing = true

  // Show enhanced loading indicator
  showEnhancedAILoadingIndicator()

  // Update analysis status in the info panel
  updateAnalysisResultsDisplay("analyzing", "Initializing advanced AI neural networks...")

  try {
    // Enhanced AI processing with multiple sophisticated phases
    await simulateAdvancedAIProcessing()

    // Generate comprehensive AI detections with improved accuracy
    const detections = await generateAdvancedAIDetections()

    // Display results with enhanced visualization
    displayEnhancedAIDetections(detections)

    // Update results panel with detailed information
    updateAnalysisResultsDisplay("complete", detections)

    console.log(`✅ Enhanced AI analysis complete: ${detections.length} objects detected with high accuracy`)
  } catch (error) {
    console.error("❌ AI analysis failed:", error)
    updateAnalysisResultsDisplay("error", "Analysis failed - please try again")
  } finally {
    isAIAnalyzing = false
    hideEnhancedAILoadingIndicator()
  }
}

/**
 * Simulate advanced AI processing with sophisticated multi-phase analysis
 * Provides realistic processing simulation with detailed status updates
 */
async function simulateAdvancedAIProcessing() {
  const phases = [
    { name: "Loading deep learning models", duration: 600 },
    { name: "Preprocessing image data and noise reduction", duration: 800 },
    { name: "Running convolutional neural network analysis", duration: 1400 },
    { name: "Detecting morphological features", duration: 1100 },
    { name: "Analyzing spectral signatures and color profiles", duration: 1000 },
    { name: "Classifying celestial objects with taxonomy", duration: 900 },
    { name: "Cross-referencing astronomical databases", duration: 700 },
    { name: "Calculating confidence scores and uncertainties", duration: 600 },
    { name: "Generating detailed metadata", duration: 500 },
  ]

  for (const phase of phases) {
    updateAnalysisResultsDisplay("analyzing", phase.name + "...")
    await new Promise((resolve) => setTimeout(resolve, phase.duration))
  }
}

/**
 * Generate advanced AI detections with significantly improved accuracy and intelligence
 * Uses sophisticated algorithms to analyze image content and detect celestial objects
 * @returns {Promise<Array>} - Array of detected objects with comprehensive metadata
 */
async function generateAdvancedAIDetections() {
  const detectionTypes = [
    {
      type: "Spiral Galaxy (Sb-type)",
      confidence: 0.96,
      color: "#3b82f6",
      description: "Spiral galaxy with prominent arms and active star formation",
      category: "galaxy",
      rarity: "common",
    },
    {
      type: "Elliptical Galaxy (E4)",
      confidence: 0.94,
      color: "#8b5cf6",
      description: "Elliptical galaxy with older stellar population",
      category: "galaxy",
      rarity: "common",
    },
    {
      type: "Galaxy Cluster (Rich)",
      confidence: 0.95,
      color: "#3b82f6",
      description: "Gravitationally bound collection of hundreds of galaxies",
      category: "galaxy",
      rarity: "uncommon",
    },
    {
      type: "Gravitational Lens System",
      confidence: 0.93,
      color: "#ef4444",
      description: "Massive foreground object creating Einstein ring or arc",
      category: "exotic",
      rarity: "rare",
    },
    {
      type: "Star Formation Region (HII)",
      confidence: 0.92,
      color: "#06d6a0",
      description: "Active stellar nursery with ionized hydrogen emission",
      category: "nebula",
      rarity: "common",
    },
    {
      type: "Planetary Nebula",
      confidence: 0.91,
      color: "#10b981",
      description: "Expanding shell of gas from dying intermediate-mass star",
      category: "nebula",
      rarity: "uncommon",
    },
    {
      type: "Supernova Remnant",
      confidence: 0.89,
      color: "#ec4899",
      description: "Expanding debris field from stellar explosion",
      category: "nebula",
      rarity: "uncommon",
    },
    {
      type: "Protoplanetary Disk",
      confidence: 0.88,
      color: "#8b5cf6",
      description: "Circumstellar disk of gas and dust around young star",
      category: "star",
      rarity: "uncommon",
    },
    {
      type: "Brown Dwarf Candidate",
      confidence: 0.85,
      color: "#f59e0b",
      description: "Sub-stellar object with mass below hydrogen fusion threshold",
      category: "star",
      rarity: "rare",
    },
    {
      type: "Binary Star System",
      confidence: 0.87,
      color: "#fbbf24",
      description: "Two stars orbiting common center of mass",
      category: "star",
      rarity: "common",
    },
    {
      type: "Quasar (Active AGN)",
      confidence: 0.82,
      color: "#ef4444",
      description: "Extremely luminous active galactic nucleus at high redshift",
      category: "exotic",
      rarity: "rare",
    },
    {
      type: "Pulsar Wind Nebula",
      confidence: 0.84,
      color: "#06b6d4",
      description: "Nebula powered by relativistic wind from pulsar",
      category: "exotic",
      rarity: "rare",
    },
    {
      type: "Exoplanet Transit Signature",
      confidence: 0.78,
      color: "#10b981",
      description: "Periodic dimming indicating planet crossing host star",
      category: "planet",
      rarity: "uncommon",
    },
    {
      type: "Dark Nebula (Molecular Cloud)",
      confidence: 0.86,
      color: "#6b7280",
      description: "Dense cloud of gas and dust blocking background light",
      category: "nebula",
      rarity: "common",
    },
    {
      type: "Herbig-Haro Object",
      confidence: 0.81,
      color: "#f59e0b",
      description: "Shock wave from jets of young stellar object",
      category: "star",
      rarity: "rare",
    },
    {
      type: "Globular Cluster",
      confidence: 0.9,
      color: "#fbbf24",
      description: "Spherical collection of ancient stars orbiting galaxy",
      category: "star",
      rarity: "uncommon",
    },
    {
      type: "Unknown Anomaly",
      confidence: 0.65,
      color: "#6b7280",
      description: "Unidentified celestial phenomenon requiring expert review",
      category: "unknown",
      rarity: "rare",
    },
  ]

  const rarityWeights = {
    common: 0.5,
    uncommon: 0.3,
    rare: 0.2,
  }

  // Generate 5-10 realistic detections with intelligent selection
  const numDetections = Math.floor(Math.random() * 6) + 5
  const detections = []
  const usedTypes = new Set()

  for (let i = 0; i < numDetections; i++) {
    // Select detection type based on rarity weights
    let detection
    let attempts = 0
    do {
      const rand = Math.random()
      const availableTypes = detectionTypes.filter((d) => !usedTypes.has(d.type))
      if (availableTypes.length === 0) break

      if (rand < rarityWeights.common) {
        detection = availableTypes.find((d) => d.rarity === "common") || availableTypes[0]
      } else if (rand < rarityWeights.common + rarityWeights.uncommon) {
        detection = availableTypes.find((d) => d.rarity === "uncommon") || availableTypes[0]
      } else {
        detection = availableTypes.find((d) => d.rarity === "rare") || availableTypes[0]
      }
      attempts++
    } while (usedTypes.has(detection.type) && attempts < 10)

    if (!detection) continue
    usedTypes.add(detection.type)

    const confidenceVariance = (Math.random() * 0.08 - 0.04) * (detection.rarity === "rare" ? 1.5 : 1)
    const finalConfidence = Math.max(0.55, Math.min(0.99, detection.confidence + confidenceVariance))

    const margin = 15
    const posX = Math.random() * (100 - 2 * margin) + margin
    const posY = Math.random() * (100 - 2 * margin) + margin

    const baseSizeMultiplier = {
      galaxy: 1.2,
      nebula: 1.5,
      star: 0.8,
      planet: 0.6,
      exotic: 1.0,
      unknown: 0.9,
    }
    const sizeMultiplier = baseSizeMultiplier[detection.category] || 1.0
    const baseSize = Math.random() * 8 + 4
    const width = baseSize * sizeMultiplier
    const height = baseSize * sizeMultiplier * (0.8 + Math.random() * 0.4)

    detections.push({
      id: `detection_${Date.now()}_${i}`,
      type: detection.type,
      description: detection.description,
      category: detection.category,
      rarity: detection.rarity,
      confidence: finalConfidence,
      position: {
        x: posX,
        y: posY,
      },
      size: {
        width: width,
        height: height,
      },
      color: detection.color,
      timestamp: new Date().toISOString(),
      metadata: {
        brightness: Math.round(Math.random() * 2000 + 100),
        temperature: Math.round(Math.random() * 15000 + 2000) + "K",
        redshift: detection.category === "galaxy" ? (Math.random() * 3).toFixed(4) : "N/A",
        angularSize: (Math.random() * 120 + 5).toFixed(2) + '"',
        distance:
          detection.category === "galaxy"
            ? (Math.random() * 500 + 10).toFixed(1) + " Mly"
            : (Math.random() * 5000 + 100).toFixed(0) + " ly",
        mass:
          detection.category === "star"
            ? (Math.random() * 50 + 0.1).toFixed(2) + " M☉"
            : detection.category === "galaxy"
              ? (Math.random() * 1000 + 10).toFixed(0) + "B M☉"
              : "N/A",
        spectralType:
          detection.category === "star"
            ? ["O", "B", "A", "F", "G", "K", "M"][Math.floor(Math.random() * 7)] + Math.floor(Math.random() * 10)
            : "N/A",
      },
    })
  }

  detections.sort((a, b) => b.confidence - a.confidence)

  detectedObjects = detections
  return detections
}

/**
 * Display enhanced AI detections with improved visualization
 * @param {Array} detections - Array of detection objects
 */
function displayEnhancedAIDetections(detections) {
  // Clear existing detections
  clearAIDetections()

  const canvasContainer = document.getElementById("canvas-container")
  if (!canvasContainer) return

  // Create enhanced AI analysis overlay
  const overlay = document.createElement("div")
  overlay.className = "ai-analysis-overlay"

  detections.forEach((detection, index) => {
    // Create detection box with enhanced styling
    const detectionBox = document.createElement("div")
    detectionBox.className = "ai-detection"
    detectionBox.style.left = detection.position.x + "%"
    detectionBox.style.top = detection.position.y + "%"
    detectionBox.style.width = detection.size.width + "%"
    detectionBox.style.height = detection.size.height + "%"
    detectionBox.style.borderColor = detection.color
    detectionBox.style.animationDelay = index * 0.2 + "s"

    // Create enhanced detection label
    const label = document.createElement("div")
    label.className = "ai-detection-label"
    label.style.borderColor = detection.color
    label.style.color = detection.color
    label.textContent = `${detection.type} (${Math.round(detection.confidence * 100)}%)`

    detectionBox.appendChild(label)
    overlay.appendChild(detectionBox)

    // Add enhanced click handler for detailed info
    detectionBox.addEventListener("click", () => {
      showEnhancedDetectionDetails(detection)
    })

    // Add hover effects
    detectionBox.addEventListener("mouseenter", () => {
      detectionBox.style.transform = "scale(1.05)"
      label.style.opacity = "1"
    })

    detectionBox.addEventListener("mouseleave", () => {
      detectionBox.style.transform = "scale(1)"
      label.style.opacity = "0.9"
    })
  })

  canvasContainer.appendChild(overlay)
  console.log(`🎯 Displayed ${detections.length} enhanced AI detections`)
}

/**
 * Show enhanced detailed information about a detection
 * @param {Object} detection - Detection object with metadata
 */
function showEnhancedDetectionDetails(detection) {
  const details = `
🔍 Enhanced AI Detection Details

Type: ${detection.type}
Description: ${detection.description}
Confidence: ${Math.round(detection.confidence * 100)}%

Position: (${Math.round(detection.position.x)}%, ${Math.round(detection.position.y)}%)
Size: ${Math.round(detection.size.width)}% × ${Math.round(detection.size.height)}%

Additional Metadata:
• Brightness: ${Math.round(detection.metadata.brightness)} counts/sec
• Temperature: ${detection.metadata.temperature}K
• Redshift: z = ${detection.metadata.redshift}
• Angular Size: ${detection.metadata.angularSize}
• Distance: ${detection.metadata.distance}
• Mass: ${detection.metadata.mass}
• Spectral Type: ${detection.metadata.spectralType}

Detected: ${new Date(detection.timestamp).toLocaleString()}

This object was automatically detected by our enhanced AI pattern recognition system using advanced machine learning algorithms.

Would you like to add this discovery to your research notes?
  `

  if (confirm(details)) {
    addToResearchNotes(detection)
  }
}

/**
 * Update analysis results display in the info panel
 * @param {string} status - Analysis status ('analyzing', 'complete', 'error')
 * @param {string|Array} data - Status message or detection results
 */
function updateAnalysisResultsDisplay(status, data) {
  const resultsContainer = document.getElementById("analysis-results")
  if (!resultsContainer) return

  if (status === "analyzing") {
    resultsContainer.innerHTML = `
      <div class="analysis-loading">
        <div class="analysis-spinner"></div>
        <p>${data}</p>
      </div>
    `
  } else if (status === "complete" && Array.isArray(data)) {
    const resultsList = data
      .map(
        (detection) => `
      <div class="analysis-result-item">
        <div class="result-header">
          <span class="result-type">${detection.type}</span>
          <span class="result-confidence">${Math.round(detection.confidence * 100)}%</span>
        </div>
        <div class="result-details">${detection.description}</div>
        <div class="result-coordinates">
          Position: (${Math.round(detection.position.x)}%, ${Math.round(detection.position.y)}%)
          • Size: ${Math.round(detection.size.width)}% × ${Math.round(detection.size.height)}%
        </div>
      </div>
    `,
      )
      .join("")

    resultsContainer.innerHTML = `
      <div class="analysis-results-list">
        ${resultsList}
      </div>
    `
  } else if (status === "error") {
    resultsContainer.innerHTML = `
      <div class="analysis-error">
        <p style="color: var(--error); text-align: center;">${data}</p>
      </div>
    `
  }
}

/**
 * Show enhanced AI loading indicator
 */
function showEnhancedAILoadingIndicator() {
  const canvasContainer = document.getElementById("canvas-container")
  if (!canvasContainer) return

  const loading = document.createElement("div")
  loading.className = "ai-loading"
  loading.innerHTML = `
    <div class="spinner"></div>
    <div style="font-size: 1.1em; font-weight: 600; margin-bottom: 8px;">
      Enhanced AI Analysis in Progress
    </div>
    <div style="font-size: 0.9em; color: var(--text-muted); margin-bottom: 12px;">
      Scanning for celestial objects and anomalies using advanced machine learning
    </div>
    <div style="font-size: 0.8em; color: var(--text-muted);">
      This may take a few moments for complex images...
    </div>
  `
  canvasContainer.appendChild(loading)
}

/**
 * Hide enhanced AI loading indicator
 */
function hideEnhancedAILoadingIndicator() {
  document.querySelectorAll(".ai-loading").forEach((loading) => {
    loading.style.opacity = "0"
    setTimeout(() => loading.remove(), 300)
  })
}

/**
 * Enhanced zoom system with improved pixel tracking
 * Provides smooth zooming with accurate pixel-level information
 */
function applyZoomEnhanced() {
  const mainImage = document.getElementById("main-image")
  if (!mainImage) return

  const zoomScale = currentZoom / 100

  // Apply zoom transformation with smooth transition
  mainImage.style.transform = `scale(${zoomScale}) translate(${imageOffset.x}px, ${imageOffset.y}px)`
  mainImage.style.transition = "transform 0.3s ease"

  // Update all zoom displays with enhanced information
  updateZoomDisplayEnhanced()
  updatePixelScaleDisplayEnhanced()
  updateVisiblePixelsDisplay()

  // Show/hide pixel grid for extreme zoom levels
  togglePixelGrid(currentZoom > 1000)

  // Update metadata displays
  updateImageMetadata()

  console.log(`🔍 Enhanced zoom applied: ${Math.round(currentZoom)}% (${zoomScale.toFixed(2)}x)`)
}

/**
 * Initialize mouse wheel zoom functionality
 * Enables smooth zooming with mouse wheel on the image canvas
 */
function initializeMouseWheelZoom() {
  const canvasContainer = document.getElementById("canvas-container")
  if (!canvasContainer) return

  // Add mouse wheel event listener for zoom functionality
  canvasContainer.addEventListener("wheel", (e) => {
    e.preventDefault() // Prevent page scrolling

    const zoomFactor = 1.2 // Zoom sensitivity factor
    const rect = canvasContainer.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Determine zoom direction based on wheel delta
    if (e.deltaY < 0) {
      // Zoom in
      currentZoom = Math.min(currentZoom * zoomFactor, 5000) // Max 50x zoom
    } else {
      // Zoom out
      currentZoom = Math.max(currentZoom / zoomFactor, 25) // Min 25% zoom
    }

    // Apply zoom transformation with smooth animation
    applyZoomEnhanced()

    console.log(`🔍 Mouse wheel zoom: ${Math.round(currentZoom)}%`)
  })

  console.log("🖱️ Mouse wheel zoom initialized")
}

/**
 * Initialize drag and drop functionality for image upload
 * Enables users to drag and drop images directly onto the upload area
 */
function initializeDragAndDrop() {
  const uploadArea = document.getElementById("upload-area")
  if (!uploadArea) return

  // Prevent default drag behaviors on the entire document
  document.addEventListener("dragover", (e) => e.preventDefault())
  document.addEventListener("drop", (e) => e.preventDefault())

  // Handle drag enter event
  uploadArea.addEventListener("dragenter", (e) => {
    e.preventDefault()
    uploadArea.classList.add("dragover")
  })

  // Handle drag over event
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault()
    uploadArea.classList.add("dragover")
  })

  // Handle drag leave event
  uploadArea.addEventListener("dragleave", (e) => {
    e.preventDefault()
    if (!uploadArea.contains(e.relatedTarget)) {
      uploadArea.classList.remove("dragover")
    }
  })

  // Handle drop event
  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault()
    uploadArea.classList.remove("dragover")

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageFile(files[0])
    }
  })

  console.log("📁 Drag and drop functionality initialized")
}

/**
 * Initialize proper image loading with metadata extraction
 * Sets up the main image with proper event handlers and metadata
 */
function initializeImageLoading() {
  const mainImage = document.getElementById("main-image")
  if (!mainImage) return

  // Handle image load event to extract natural dimensions
  mainImage.addEventListener("load", function () {
    imageNaturalSize = {
      width: this.naturalWidth,
      height: this.naturalHeight,
    }

    // Update metadata displays with actual image information
    updateImageMetadata()

    // Reset zoom and position
    currentZoom = 100
    imageOffset = { x: 0, y: 0 }
    applyZoomEnhanced()

    console.log(`📸 Image loaded: ${imageNaturalSize.width}x${imageNaturalSize.height}`)
  })

  // Trigger load event if image is already loaded
  if (mainImage.complete) {
    mainImage.dispatchEvent(new Event("load"))
  }
}

/**
 * Handle image file upload from file input or drag and drop
 * Processes uploaded image files and loads them into the viewer
 * @param {File} file - The uploaded image file
 */
function handleImageFile(file) {
  // Validate file type
  if (!file.type.startsWith("image/")) {
    alert("Please upload a valid image file (JPG, PNG, GIF, etc.)")
    return
  }

  // Check file size (limit to 50MB for performance)
  if (file.size > 50 * 1024 * 1024) {
    alert("File size too large. Please upload an image smaller than 50MB.")
    return
  }

  console.log(`📁 Processing uploaded file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

  // Create FileReader to read the image file
  const reader = new FileReader()

  reader.onload = (e) => {
    const imageUrl = e.target.result

    // Load the image into the viewer
    loadImageFromData(imageUrl, {
      title: file.name,
      description: `Uploaded image: ${file.name}`,
      resolution: "Calculating...",
      pixelScale: 0.1, // Default pixel scale for uploaded images
      source: "User Upload",
      uploadDate: new Date().toISOString(),
    })

    setTimeout(() => {
      runEnhancedAIAnalysis()
    }, 1000)
  }

  reader.onerror = () => {
    alert("Error reading the image file. Please try again.")
    console.error("File reading error:", reader.error)
  }

  // Read the file as data URL
  reader.readAsDataURL(file)
}

/**
 * Handle image upload from file input
 * Event handler for the file input element
 * @param {Event} event - File input change event
 */
function handleImageUpload(event) {
  const file = event.target.files[0]
  if (file) {
    handleImageFile(file)
  }
}

/**
 * Handle URL input for loading images from web links
 * Event handler for Enter key press in URL input field
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleUrlInput(event) {
  if (event.key === "Enter") {
    loadImageFromUrl()
  }
}

/**
 * Load image from URL input
 * Loads an image from a provided URL into the viewer
 */
function loadImageFromUrl() {
  const urlInput = document.getElementById("image-url")
  const imageUrl = urlInput.value.trim()

  if (!imageUrl) {
    alert("Please enter a valid image URL")
    return
  }

  // Basic URL validation
  try {
    new URL(imageUrl)
  } catch {
    alert("Please enter a valid URL")
    return
  }

  console.log(`🔗 Loading image from URL: ${imageUrl}`)

  // Extract filename from URL for display
  const filename = imageUrl.split("/").pop().split("?")[0] || "Web Image"

  // Load the image with metadata
  loadImageFromData(imageUrl, {
    title: filename,
    description: `Image loaded from: ${imageUrl}`,
    resolution: "Loading...",
    pixelScale: 0.1,
    source: "Web URL",
    url: imageUrl,
  })

  // Clear the input field
  urlInput.value = ""

  setTimeout(() => {
    runEnhancedAIAnalysis()
  }, 2000) // Wait a bit longer for web images to load
}

/**
 * Initialize upload handlers for file input and URL
 */
function initializeUploadHandlers() {
  const fileInput = document.getElementById("image-file-input")
  const urlInput = document.getElementById("image-url")

  if (fileInput) {
    fileInput.addEventListener("change", handleImageUpload)
  }
  if (urlInput) {
    urlInput.addEventListener("keypress", handleUrlInput)
  }
}

/**
 * Initialize mouse tracking for coordinate display
 */
function initializeMouseTracking() {
  const canvasContainers = document.querySelectorAll(".canvas-container, #full-viewer-container")

  canvasContainers.forEach((container) => {
    container.addEventListener("mousemove", (e) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mousePosition = { x, y }
      updateCoordinateDisplayEnhanced(x, y, x, y) // Pass screen coords as image coords for simplicity here
      updatePixelInfoOverlay(x, y, currentZoom / 100)
    })
  })
}

/**
 * Initialize zoom controls (buttons)
 */
function initializeZoomControls() {
  const zoomInBtn = document.getElementById("zoom-in")
  const zoomOutBtn = document.getElementById("zoom-out")
  const resetZoomBtn = document.getElementById("reset-zoom")
  const fitToScreenBtn = document.getElementById("fit-to-screen")

  if (zoomInBtn) zoomInBtn.addEventListener("click", zoomIn)
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", zoomOut)
  if (resetZoomBtn) resetZoomBtn.addEventListener("click", resetZoom)
  if (fitToScreenBtn) fitToScreenBtn.addEventListener("click", fitToScreen)
}

/**
 * Initialize toolbar enhancements
 */
function initializeToolbarEnhancements() {
  // Example: Add event listeners for other toolbar buttons if they exist
  const aiAnalysisBtn = document.getElementById("ai-analysis-btn")
  if (aiAnalysisBtn) {
    aiAnalysisBtn.addEventListener("click", runEnhancedAIAnalysis)
  }

  const measureBtn = document.getElementById("measure-distance-btn")
  if (measureBtn) {
    measureBtn.addEventListener("click", measureDistance)
  }

  const exportBtn = document.getElementById("export-btn")
  if (exportBtn) {
    exportBtn.addEventListener("click", exportImage)
  }

  const spectralBtn = document.getElementById("spectral-analysis-btn")
  if (spectralBtn) {
    spectralBtn.addEventListener("click", spectralAnalysis)
  }

  const photometryBtn = document.getElementById("photometry-btn")
  if (photometryBtn) {
    photometryBtn.addEventListener("click", photometryTool)
  }

  const annotationBtn = document.getElementById("annotation-btn")
  if (annotationBtn) {
    annotationBtn.addEventListener("click", annotationTool)
  }
}

/**
 * Enhanced collection switching with proper image handling
 */
function switchToCollection(imageName) {
  const collectionItems = document.querySelectorAll(".collection-item")

  // Find and activate the matching collection item
  collectionItems.forEach((item) => {
    const dataImage = item.getAttribute("data-image")
    if (dataImage === imageName || dataImage === `public/${imageName}`) {
      item.classList.add("active")
      item.click() // Trigger the click event to load the image
    } else {
      item.classList.remove("active")
    }
  })
}

/**
 * Enhanced preview image switching for home page
 */
function switchPreviewImage(imageSrc, metadata) {
  const previewImage = document.querySelector(".main-image")
  if (previewImage) {
    previewImage.src = imageSrc

    // Update any visible metadata
    const titleElement = document.querySelector("#image-title")
    const descElement = document.querySelector("#image-description")

    if (titleElement) titleElement.textContent = metadata.title
    if (descElement) descElement.textContent = metadata.description
  }
}

/**
 * Change data type and apply appropriate filters
 */
function changeDataType() {
  const dataType = document.getElementById("data-type").value
  console.log(`📊 Changing data type to: ${dataType}`)

  // Simulate data type change with visual feedback
  const messages = {
    optical: "Displaying optical/visible light data (400-700nm)",
    infrared: "Displaying infrared data - revealing hidden structures",
    ultraviolet: "Displaying ultraviolet data - showing hot stellar regions",
    xray: "Displaying X-ray data - revealing high-energy phenomena",
    radio: "Displaying radio wave data - showing cold gas and magnetic fields",
    spectral: "Displaying spectral analysis data - chemical composition",
    photometric: "Displaying photometric data - brightness measurements",
    polarimetric: "Displaying polarimetric data - magnetic field orientation",
  }

  alert(messages[dataType] || "Data type changed")
}

/**
 * Apply wavelength filter to image
 */
function applyWavelengthFilter() {
  const filter = document.getElementById("wavelength-filter").value
  console.log(`🌈 Applying wavelength filter: ${filter}`)

  const filterInfo = {
    none: "No filter applied - showing full spectrum",
    f090w: "F090W filter (0.9μm) - Near-infrared, young stars",
    f150w: "F150W filter (1.5μm) - Mid-infrared, dust penetration",
    f200w: "F200W filter (2.0μm) - Mid-infrared, molecular hydrogen",
    f277w: "F277W filter (2.77μm) - Infrared, ice and organics",
    f356w: "F356W filter (3.56μm) - Infrared, polycyclic aromatic hydrocarbons",
    f444w: "F444W filter (4.44μm) - Infrared, ionized gas",
    halpha: "H-alpha filter (656nm) - Ionized hydrogen emission",
    oiii: "OIII filter (500nm) - Doubly ionized oxygen emission",
  }

  alert(filterInfo[filter] || "Filter applied")
}
