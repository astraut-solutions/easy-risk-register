# **User Requested Tech Stack Documentation**

The user’s preferred tech stack is below.  

You are permitted to expand upon it with new tools, but you cannot replace any of these without explicit permission.

For anything not explicitly outlined, always prefer built-in Expo solutions.

Prefer open-source components and OSS alternatives while maintaining equivalent functionality, performance, scalability, and ease of use in comparison to the best top paid tier.  

---

## **Frontend**

### **Core**
- **React** (via **Vite** for fast builds; aligns with Expo’s ease but for web)
- **TypeScript**
- **Vite** for development/build (supports **PWA** out-of-the-box)

### **Data Flow & State**
- **Zustand** for state management  
- **React Hook Form** for form state  
- **React Query** for server state (useful for optional local or cached async tasks)

### **Navigation**
- **React Router** (web equivalent of React Navigation)  
- **React Router** built-in linking for deep links (if needed)

### **UI, Styling, & Interactivity**
- **Framer Motion** for animations (web-friendly alternative to Reanimated)  
- **NativeBase** (with web support via `@native-base/web`)  
- **Tailwind CSS** (web equivalent of NativeWind; highly customizable)  
- **Custom design token system** (via Tailwind config or CSS variables)  
- **React Icons** or **Heroicons** (web alternative to Expo Vector Icons)  
- *(No direct Gesture Handler needed for web; use native browser events or `react-use-gesture` if complex gestures arise)*  
- *(No Haptics for web; use subtle CSS animations or audio cues if feedback is essential)*

### **Networking**
- **Fetch API** for HTTP requests  
- **GraphQL** (via **Apollo Client**, if optional data layer integration is required)

### **Data Storage**
- **LocalStorage / IndexedDB** for client-side persistence (secure and offline-capable)  
- **PocketBase** instance for cloud sync or team data (self-hosted OSS BaaS with built-in Postgres-like DB)

### **Authentication & Authorization**
- **PocketBase Auth** (built-in OSS authentication; works seamlessly on web)  
- *(Use WebAuthn for passkeys if advanced security is required)*

### **Media & Camera**
- *(Omit unless adding features like risk photo attachments; use browser **MediaDevices API** for web camera access if expanded)*

### **Other**
- **Web Push API** or **ntfy.sh** for notifications (OSS self-hosted alternative to Firebase; supports web push)  
- **i18next** or browser **Intl API** for localisation  
- **Jest** for unit testing  
- **Service Workers** for PWA/offline support (built-in browser solution)

---

## **Image Processing** *(If expanded to include visuals/charts; otherwise omit)*
- **MinIO** + **ImgProxy** (OSS S3-compatible storage + image processor)  
- *(Use Pillow in Python backend only if image processing is required)*

---

## **Background Jobs**
- **Redis + RQ** (for optional background tasks such as report generation or data sync)

---

## **CI/CD**
- **GitLab CI** (self-hosted OSS alternative to GitHub Actions)  
- **OpenTelemetry + Grafana Tempo** for error monitoring

---

## **Deployment**
- **GitHub Pages** or **Coolify** for frontend (OSS self-hosted PWA/static hosting; aligns with free deployment model)  
- **Coolify** or **Dokku** for backend (OSS self-hosted alternatives to Render/Fly.io; freemium via VPS)  
- **Docker containers** for consistent environment management