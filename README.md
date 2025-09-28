# 🎟️ DAYM Tickets - Decentralized Event Ticketing Platform

A modern, blockchain-powered event ticketing system built on Sui Network with zkLogin authentication and Move smart contracts.

## 🌟 Overview

DAYM Tickets is a decentralized application that revolutionizes event ticketing by leveraging blockchain technology to ensure transparency, prevent fraud, and enable seamless ticket management. The platform supports both event organizers and participants with a role-based authentication system.

## 🏗️ Architecture

### Frontend Stack
- **React 19** - Modern UI framework with latest features
- **Vite** - Fast development server and build tool
- **Tailwind CSS v4** - Utility-first styling with glass morphism design
- **React Router** - Client-side routing
- **Sui dApp Kit** - Blockchain integration components

### Blockchain Layer
- **Sui Network** - High-performance blockchain platform
- **Move Language** - Smart contract development
- **zkLogin** - Privacy-preserving authentication with Google OAuth
- **Sui TypeScript SDK** - Blockchain interaction layer

### Smart Contract Features
- **Event Management** - Create and manage events on-chain
- **NFT Ticketing** - Each ticket is a unique NFT
- **Inventory System** - Capacity management with place allocation
- **Organizer Registry** - On-chain organizer verification

## 📁 Project Structure

```
hackathon-2025/
├── frontend/daym_tickets/          # React frontend application
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   │   ├── ui/               # Base UI components (Button, Card, Modal, etc.)
│   │   │   └── Navigation.jsx    # App navigation
│   │   ├── contexts/             # React Context providers
│   │   │   ├── AuthContext.jsx   # Authentication & zkLogin
│   │   │   ├── BlockchainContext.jsx # Blockchain state
│   │   │   └── ThemeContext.jsx  # Theme management
│   │   ├── pages/                # Application pages
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── SignIn.jsx        # Authentication with role selection
│   │   │   ├── CreateEvent.jsx   # Event creation form
│   │   │   ├── Profile.jsx       # User profile & Move testing
│   │   │   └── Verifier.jsx      # Ticket verification
│   │   ├── services/             # Business logic services
│   │   │   ├── zklogin.js        # zkLogin authentication service
│   │   │   ├── moveService.js    # Move contract integration
│   │   │   └── blockchain.js     # Blockchain utilities
│   │   └── utils/                # Utility functions
│   ├── public/                   # Static assets
│   └── package.json              # Dependencies and scripts
└── move/tickets_package/          # Move smart contracts
    ├── sources/
    │   └── tickets_package.move   # Main contract implementation
    ├── tests/                     # Move contract tests
    └── Move.toml                  # Move package configuration
```

## 🚀 Features

### ✅ Implemented
- **zkLogin Authentication** - Google OAuth integration with Sui zkLogin
- **Role-Based Access** - Organizer vs Participant user types
- **Glass Morphism UI** - Modern, responsive design system
- **Mock Data System** - Development-ready event data
- **Context Architecture** - Clean state management with React Context
- **Move Contract Integration** - Smart contract service layer
- **Wallet Integration** - Sui wallet connectivity
- **OAuth Callback Handling** - Secure authentication flow

### 🔧 In Development
- **Move Contract Testing** - On-chain function validation
- **Event Creation Flow** - Complete event setup process
- **Ticket Purchase System** - NFT minting and transfers
- **Inventory Management** - Real-time capacity tracking

### 📋 Planned Features
- **QR Code Generation** - Ticket verification system
- **Event Discovery** - Browse and search events
- **Secondary Market** - Ticket resale functionality
- **Analytics Dashboard** - Event metrics and insights
- **Multi-chain Support** - Additional blockchain networks

## 🛠️ Current Status

### Authentication System ✅
```javascript
// zkLogin with Google OAuth working
const authResult = await zkLoginService.handleAuthCallback(callbackUrl);
const userProfile = zkLoginService.getUserProfile();
```

### Move Contract Integration 🔧
```javascript
// Smart contract functions ready for testing
const result = await moveService.createOrganizer(zkWallet, organizerUrl);
const packageExists = await moveService.checkPackageExists();
```

### UI Components ✅
- Navigation with theme switching
- Role selection cards (Organizer/Participant)
- Profile page with Move testing interface
- Responsive design across devices

## 📦 Smart Contract Functions

### Organizer Management
```move
public fun create_organizer(url: String, ctx: &mut TxContext): Organizer
```

### Event Creation
```move
public fun create_event(
    organizer: &mut Organizer,
    name: String,
    location: String,
    time: String,
    category: String,
    place_names: vector<String>,
    capacities: vector<u64>,
    ctx: &mut TxContext
): Event
```

### NFT Ticketing
```move
public fun create_nft(
    inventory: &mut Inventory,
    place_name: String,
    creation_date: String,
    ctx: &mut TxContext
): Nft
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Sui CLI tools
- Google OAuth credentials

### Frontend Setup
```bash
cd frontend/daym_tickets
npm install
npm run dev
```

### Move Contract Setup
```bash
cd move/tickets_package
sui move build
sui move test
sui client publish --gas-budget 100000000
```

### Environment Configuration
Create `.env` file:
```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_SUI_NETWORK=testnet
```

## 🔐 Authentication Flow

1. **User selects role** (Organizer/Participant)
2. **zkLogin initialization** with Google OAuth
3. **JWT token processing** and salt generation
4. **Sui address derivation** from zkLogin proof
5. **Profile creation** with blockchain integration

## 🧪 Testing

### Frontend Testing
```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
```

### Move Contract Testing
```bash
sui move test         # Run Move contract tests
sui move prove        # Formal verification
```

## 🐛 Known Issues

1. **Package ID Configuration** - Needs actual published contract address
2. **Salt Server Dependency** - Currently using self-generated salt
3. **Mock Data Integration** - Transitioning from mock to real blockchain data

## 🔮 Roadmap

### Phase 1: Core Functionality (Current)
- [ ] Complete Move contract integration
- [ ] Event creation workflow
- [ ] Basic ticket purchasing

### Phase 2: Enhanced Features
- [ ] Advanced inventory management
- [ ] Ticket verification system
- [ ] Mobile responsiveness improvements

### Phase 3: Production Ready
- [ ] Security audit
- [ ] Performance optimization
- [ ] Multi-language support

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Team

Built for the 2025 Sui Hackathon by the SUIxBSA-DAYM team.

## 📞 Support

For questions and support, please open an issue or contact the development team.

---

**Status**: 🔧 In Development | **Last Updated**: September 27, 2025 | **Version**: 0.1.0