/**
 * Mock event data for demonstration purposes
 * Used for participant testing without requiring full event creation
 */

export const mockEvent = {
  id: 'demo-blockchain-conference',
  title: 'Blockchain Future Conference 2025',
  description: 'Join us for the most exciting blockchain conference of the year! Learn about Web3, DeFi, NFTs, and the future of decentralized technologies. Network with industry leaders, developers, and enthusiasts.',
  date: '2025-12-15T18:00:00.000Z',
  location: 'Silicon Valley Convention Center, San Francisco, CA',
  totalTickets: 500,
  soldTickets: 287,
  availableTickets: 213,
  price: 125,
  imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
  creatorAddress: '0x1234567890abcdef1234567890abcdef12345678',
  creator: '0x1234567890abcdef1234567890abcdef12345678', // For EventRegister compatibility
  creatorName: 'Tech Events Co.',
  created: '2025-09-20T10:00:00.000Z',
  status: 'active',
  category: 'Technology',
  tags: ['blockchain', 'web3', 'defi', 'conference', 'networking'],
  features: [
    '🎤 Keynote speakers from major blockchain companies',
    '🤝 Networking sessions with industry professionals', 
    '🍽️ Catered lunch and refreshments',
    '🎁 Exclusive conference swag and NFT commemorative token',
    '📚 Access to presentation materials and recordings'
  ],
  schedule: [
    { time: '9:00 AM', activity: 'Registration & Coffee' },
    { time: '10:00 AM', activity: 'Opening Keynote: The Future of Web3' },
    { time: '11:00 AM', activity: 'Panel: DeFi Revolution' },
    { time: '12:00 PM', activity: 'Networking Lunch' },
    { time: '1:30 PM', activity: 'Workshop: Building on Sui Blockchain' },
    { time: '3:00 PM', activity: 'Fireside Chat: NFTs Beyond Art' },
    { time: '4:00 PM', activity: 'Closing Remarks & Networking' }
  ],
  ticketTiers: [
    {
      name: 'General Admission',
      price: 125,
      available: 150,
      benefits: ['Conference access', 'Lunch included', 'Networking sessions']
    },
    {
      name: 'VIP Experience', 
      price: 275,
      available: 25,
      benefits: ['All General benefits', 'VIP seating', 'Meet & greet with speakers', 'Exclusive after-party']
    },
    {
      name: 'Student Discount',
      price: 75, 
      available: 38,
      benefits: ['Conference access', 'Lunch included', 'Student networking session']
    }
  ],
  venue: {
    name: 'Silicon Valley Convention Center',
    address: '5001 Great America Pkwy, Santa Clara, CA 95054',
    capacity: 500,
    parking: 'Free parking available',
    accessibility: 'Fully accessible venue with ADA compliance'
  },
  organizer: {
    name: 'Tech Events Co.',
    email: 'hello@techevents.co',
    website: 'https://techevents.co',
    verified: true
  },
  policies: {
    refund: 'Full refund available until 7 days before event',
    ageRestriction: '18+',
    dresscode: 'Business casual recommended',
    photography: 'Photography and recording permitted'
  }
};

// Additional mock events for variety
export const mockEvents = [
  mockEvent,
  {
    id: 'nft-art-gallery-2025',
    title: 'NFT Digital Art Gallery Opening',
    description: 'Experience the future of digital art in our immersive NFT gallery. Featuring works from renowned digital artists and emerging creators.',
    date: '2025-11-28T19:00:00.000Z',
    location: 'Modern Art Museum, New York, NY',
    totalTickets: 200,
    soldTickets: 145,
    availableTickets: 55,
    price: 85,
    imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    creatorAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    creator: '0xabcdef1234567890abcdef1234567890abcdef12', // For EventRegister compatibility
    creatorName: 'Digital Arts Collective',
    created: '2025-09-15T14:30:00.000Z',
    status: 'active',
    category: 'Art & Culture'
  },
  {
    id: 'defi-developer-workshop',
    title: 'DeFi Developer Workshop',
    description: 'Hands-on workshop for developers looking to build the next generation of DeFi applications. Learn smart contracts, yield farming, and more.',
    date: '2025-10-22T14:00:00.000Z',
    location: 'Tech Hub Austin, Austin, TX',
    totalTickets: 50,
    soldTickets: 42,
    availableTickets: 8,
    price: 200,
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    creatorAddress: '0x9876543210fedcba9876543210fedcba98765432',
    creator: '0x9876543210fedcba9876543210fedcba98765432', // For EventRegister compatibility
    creatorName: 'DeFi Academy',
    created: '2025-09-10T09:15:00.000Z',
    status: 'active',
    category: 'Education'
  }
];

export default { mockEvent, mockEvents };