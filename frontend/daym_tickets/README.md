# 🎟️ DAYM Tickets - Frontend Application

Modern React application for decentralized event ticketing on Sui blockchain.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Configure your Google OAuth credentials

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## 🛠️ Built With

- **React 18** - Modern UI framework
- **Vite** - Lightning-fast development server  
- **Tailwind CSS** - Utility-first styling
- **Sui dApp Kit** - Blockchain integration
- **zkLogin** - Privacy-preserving authentication

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run test` - Run test suite
- `npm run lint` - Check code quality

## 🔧 Configuration

### Environment Variables
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_REDIRECT_URI=http://localhost:5173/auth/callback  
VITE_SUI_NETWORK=testnet
VITE_PACKAGE_ID=0x...your_deployed_package_id
```

### Features
✅ zkLogin Authentication  
✅ Role-based Access Control  
✅ Event Creation & Management  
✅ NFT Ticket Purchasing  
✅ Professional Verification Interface  
✅ Responsive Design & Dark Mode

## 📁 Project Structure

```
src/
├── components/     # UI components
├── contexts/       # React contexts  
├── pages/         # Application pages
├── services/      # Business logic
├── config/        # Configuration
└── utils/         # Utilities
```

## 🌐 Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy

# Deploy to Netlify
netlify deploy --prod
```

---

For complete documentation, see the [main README](../../README.md).
