# 🤖 HummingbirdPantry Development Agent

## Overview

The HummingbirdPantry development agent is an AI-powered coding assistant designed to accelerate development of the smart pantry management application. This agent handles the complete development lifecycle from project initialization to advanced feature implementation.

## 🤖 Agent Capabilities

### Core Development Skills
- **Full-Stack Development**: React 18, TypeScript, Vite, Node.js
- **Modern UI/UX**: Tailwind CSS, Radix UI, responsive design
- **State Management**: Zustand store + focused hooks (migrating from initial Context draft)
- **Testing**: Vitest, React Testing Library, Playwright
- **Code Quality**: ESLint, Prettier, Husky pre-commit hooks, secret scanning
- **Performance**: Bundle optimization, lazy loading, virtual scrolling

### Specialized Features
- **Barcode Integration**: @zxing/library for real-time scanning
- **Voice Recognition**: Web Speech API for voice commands
- **Camera Integration**: Photo capture for item recognition
- **Mobile Optimization**: iPhone-first responsive design
- **Data Persistence**: IndexedDB + localStorage with optimistic updates

## 📋 Development Workflow

### Phase-Based Development
1. **Phase 1**: Foundation & Core Setup ✅
2. **Phase 2**: Core Pantry Management ✅
3. **Phase 2.5**: Voice Recognition & Photo Features
4. **Phase 3**: Advanced Shopping & AI Chat
5. **Phase 4**: PWA & Offline Capabilities
6. **Phase 5**: Analytics & Insights
7. **Phase 6**: Testing & Quality Assurance
8. **Phase 7**: Performance Optimization

### Task Management
- **Automated Planning**: Creates structured todo lists for complex features
- **Progress Tracking**: Maintains completion status across `tasks.md` and `done.md`
- **Documentation Updates**: Automatically updates project documentation
- **Code Quality**: Ensures consistent patterns and best practices

## 🛠️ Technical Implementation

### Architecture Decisions
```typescript
// Modern React Architecture
- React 18 with concurrent features
- TypeScript for type safety
- Vite for fast development
- Custom hooks for business logic
- Context + useReducer for state management
```

### Mobile-First Approach
```css
/* Strictly one-column mobile layout */
.grid-cols-1 md:grid-cols-2 lg:grid-cols-3
/* Enhanced mobile typography */
text-lg sm:text-xl md:text-2xl
/* Touch-friendly interactions */
min-h-[44px] /* iOS touch target */
```

### Performance Optimizations
- **Bundle Splitting**: Dynamic imports for route-based code splitting
- **Virtual Scrolling**: react-window for large item lists
- **Image Optimization**: Lazy loading and compression
- **Caching Strategy**: Service worker for offline functionality

## 🎯 Key Achievements

### ✅ Recent Highlights
- **Security Hardening**: Removed committed TLS key, added secret scanning hooks, HTTPS env path support
- **Scanner Refactor (In Progress)**: Modular UI components + permission & ZXing hooks
- **Project Foundation**: React 18 + TypeScript base
- **Pantry System (Initial)**: Core item management groundwork
- **Mobile Optimization**: Single-column mobile-first layout
- **Data Models**: Comprehensive TypeScript interfaces & branded types

### 📊 Progress Snapshot
- **Overall Progress**: Core scaffolding + early feature layer
- **Immediate Focus**: Barcode scanner modularization & test harness
- **Mobile Experience**: Single-column + permission UX improvements
- **Performance Target**: <200KB initial gzipped bundle (analysis pending)

## 🔄 Development Process

### 1. Planning & Architecture
```bash
# Project initialization with comprehensive setup
npm create vite@latest hummingbirdpantry -- --template react-ts
cd hummingbirdpantry
npm install
```

### 2. Feature Implementation
```typescript
// Example: Barcode scanning integration
import { BrowserMultiFormatReader } from '@zxing/library'

const codeReader = new BrowserMultiFormatReader()
const result = await codeReader.decodeOnceFromVideoDevice(
  selectedDeviceId,
  videoElement
)
```

### 3. Testing & Quality Assurance
```bash
# Automated testing setup
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run lint          # Code quality checks
npm run build         # Production build verification
```

## 🎨 Design System

### UI Components
- **Radix UI Primitives**: Accessible, unstyled components
- **Tailwind CSS**: Utility-first styling with custom design tokens
- **Lucide Icons**: Consistent iconography across the application
- **Custom Components**: Reusable, typed components with variants

### Mobile-First Philosophy
- **Single Column Layout**: Optimal mobile viewing experience
- **Large Touch Targets**: Minimum 44px for iOS compliance
- **Enhanced Typography**: Readable fonts with proper contrast
- **Dark Background**: Improved mobile readability

## 🚀 Advanced Features Roadmap

### Phase 2.5: Voice & Photo Recognition
- **Web Speech API**: Voice commands for item addition
- **Camera Integration**: Photo capture for automatic item recognition
- **OCR Processing**: Text recognition from receipts and labels
- **Machine Learning**: Basic image classification for products

### Phase 3: AI-Powered Shopping
- **Smart Lists**: AI-generated shopping recommendations
- **Recipe Integration**: Voice-powered recipe suggestions
- **Usage Analytics**: Consumption pattern analysis
- **Predictive Restocking**: Automatic reorder suggestions

### Phase 4: PWA & Offline
- **Service Worker**: Background sync and caching
- **IndexedDB**: Complex data storage for offline functionality
- **Web App Manifest**: Native app-like experience
- **Push Notifications**: Smart reminders and alerts

## 📈 Performance Targets

### Lighthouse Scores (Target: 90+)
- **Performance**: 95+ (optimized bundle, lazy loading)
- **Accessibility**: 95+ (WCAG 2.1 AA compliance)
- **Best Practices**: 95+ (modern web standards)
- **SEO**: 90+ (meta tags, structured data)

### Bundle Size Optimization
- **Initial Bundle**: <200KB gzipped
- **Vendor Chunks**: Separated for better caching
- **Dynamic Imports**: Route-based code splitting
- **Asset Optimization**: Images, fonts, and icons compressed

## 🔧 Development Environment

### Required Tools
```json
{
  "node": ">=18.0.0",
  "npm": ">=8.0.0",
  "git": ">=2.30.0"
}
```

### Recommended Extensions
- **ESLint**: Code linting and error detection
- **Prettier**: Code formatting
- **TypeScript Importer**: Auto-import management
- **Tailwind CSS IntelliSense**: CSS class suggestions

## 🤝 Agent Collaboration

### Communication Style
- **Concise & Action-Oriented**
- **Structured Planning via Todo Lists**
- **Proactive Documentation Updates**
- **Validation First**: Lint & type-check before commits
- **Security Awareness**: Secret scanning + key hygiene integrated

### Quality Assurance
- **Type Safety**: 100% TypeScript coverage
- **Code Reviews**: Self-reviewing implementation patterns
- **Testing**: Automated test generation for critical paths
- **Documentation**: Comprehensive inline and external documentation

## 📚 Documentation Standards

### Code Documentation
```typescript
/**
 * Custom hook for pantry item management
 * @param initialItems - Initial pantry items array
 * @returns Object with items, addItem, updateItem, deleteItem methods
 */
export function usePantry(initialItems: PantryItem[] = []) {
  // Implementation with comprehensive error handling
}
```

### File Structure
```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── services/      # Business logic and API calls
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── assets/        # Static assets and styles
```

## 🎯 Success Metrics

### Development Signals
- **Security**: Secrets tooling active
- **Code Quality**: Lint + format enforced
- **Next Risk Area**: Camera/permission edge cases & offline strategy

### Feature Completeness
- **Core Functionality**: 95% complete (Phase 2 ✅)
- **Advanced Features**: 0% complete (Phase 2.5 next)
- **Quality Assurance**: 0% complete (Phase 6 planned)
- **Performance Optimization**: 0% complete (Phase 7 planned)

---

## 🚀 Next Steps

### Immediate Priorities (Current Sprint)
1. Finalize modular barcode scanner & extract diagnostics
2. Implement unit tests for camera + scanning hooks
3. Add offline barcode cache service
4. Manual barcode entry regression check
5. History purge verification (post key removal)

### Long-term Vision
- **AI Integration**: Machine learning for smart recommendations
- **Multi-platform**: iOS/Android apps with React Native
- **Social Features**: Recipe sharing and community features
- **Advanced Analytics**: Detailed usage and nutrition tracking

---

*This agent documentation is maintained automatically and reflects the current state of the HummingbirdPantry development project.*
