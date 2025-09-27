# 📚 BookStore UI

A modern, responsive web application for browsing and purchasing books, built with React and Tailwind CSS.

## ✨ Features

### 🎨 Enhanced User Interface
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI Components**: Clean, minimalistic design with smooth animations
- **Loading States**: Skeleton loaders and progress indicators
- **Interactive Elements**: Hover effects, transitions, and micro-interactions

### 🛒 Shopping Experience
- **Book Catalog**: Browse available books with pricing information
- **Shopping Cart**: Add, remove, and adjust quantities
- **Checkout Process**: Streamlined order placement and payment
- **Order History**: View past orders and payment records
- **Real-time Updates**: Live status indicators and error handling

### 🔧 Technical Features
- **Circuit Breaker Demo**: Payment service with intentional 30% failure rate
- **API Gateway Integration**: Seamless backend communication
- **Local Storage**: Persistent cart and theme preferences
- **Error Boundaries**: Graceful error handling and fallbacks
- **Performance Optimized**: Lazy loading and efficient state management

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## 🏗️ Architecture

### Frontend Stack
- **React 19** - Modern React with hooks and concurrent features
- **React Router** - Client-side routing and navigation
- **Tailwind CSS** - Utility-first CSS framework with dark mode support
- **Vite** - Fast build tool and development server

### API Integration
- **Catalog Service**: Book inventory and pricing
- **Orders Service**: Order creation and management
- **Payments Service**: Payment processing with circuit breaker
- **API Gateway**: Unified backend interface with CORS support

## 📱 Pages & Features

### 🏠 Catalog Page
- Browse available books
- Add items to cart
- Real-time inventory status
- Responsive grid layout

### 🛒 Cart Page
- Review selected items
- Adjust quantities
- Calculate totals
- Proceed to checkout

### 💳 Checkout Page
- Order summary
- Payment processing
- Error handling
- Circuit breaker demonstration

### 📋 Orders Page
- Order history
- Payment records
- Tabbed interface
- Status tracking

## 🎨 Design System

### Color Palette
- **Primary**: Blue (600-700) for actions and navigation
- **Success**: Green (600-400) for positive states
- **Warning**: Yellow (500-300) for alerts
- **Error**: Red (600-400) for failures
- **Neutral**: Gray scale for backgrounds and text

### Dark Mode Support
- Automatic system preference detection
- Manual toggle with persistent storage
- Smooth theme transitions
- Optimized contrast ratios

## ⚡ Performance Features

- **Code Splitting**: Lazy-loaded components
- **Optimistic Updates**: Fast UI responses
- **Caching**: Local storage for cart and preferences
- **Minimal Bundle**: Tree-shaking and optimization
- **Fast Refresh**: Hot module replacement in development

## 🔧 Configuration

The app supports configurable API gateway URLs through the settings panel:
- Default: Relative URLs (same origin)
- Custom: Full URLs (e.g., `http://localhost:8080`)
- Persistent: Settings saved to local storage
