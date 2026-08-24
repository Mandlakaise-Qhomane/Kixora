import { Sneaker, Drop, PromoCode, Order } from '../types';

export const INITIAL_SNEAKERS: Sneaker[] = [
  {
    id: 'kixo-shattered-backboard-01',
    name: 'Air Jordan 1 Retro "Shattered Backboard"',
    brand: 'Jordan',
    category: 'High-Top',
    gender: 'Unisex',
    price: 2999,
    originalPrice: 3499,
    sku: '555088-005',
    colorway: 'Black / Starfish / Sail',
    releaseDate: '2025-05-20',
    description: 'Inspired by the iconic moment in 1985 when Michael Jordan shattered a glass backboard in an exhibition match in Trieste, Italy. Premium tumbled leather with vibrant Starfish orange and deep black paneling.',
    details: [
      'Genuine full-grain tumbled leather upper',
      'Encapsulated Air-Sole unit in heel for lightweight cushioning',
      'Solid rubber cupsole with deep flex grooves',
      'Includes original Sail and Black laces with Vault authenticity tag'
    ],
    // High quality angle views corresponding to the 4 3D product cards in the reference image
    images: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85', // Profile angle
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=85', // 3/4 Dynamic perspective
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85', // Rear / Collar angle
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=85'  // Underside / Sole angle
    ],
    sizes: [
      { size: 7.5, stock: 4 },
      { size: 8, stock: 6 },
      { size: 8.5, stock: 8 },
      { size: 9, stock: 12 },
      { size: 9.5, stock: 14 },
      { size: 10, stock: 10 },
      { size: 10.5, stock: 8 },
      { size: 11, stock: 6 },
      { size: 11.5, stock: 3 },
      { size: 12, stock: 5 },
      { size: 13, stock: 2 }
    ],
    rating: 4.9,
    reviewsCount: 356,
    isFeatured: true,
    isNewRelease: true,
    isBestSeller: true,
    salesCount: 356,
    tags: ['Vault Grail', 'OG High', 'Deadstock', 'Starfish Orange']
  },
  {
    id: 'kixo-af1-white-02',
    name: 'Nike Air Force 1 \'07 "Triple White"',
    brand: 'Nike',
    category: 'Low-Top',
    gender: 'Unisex',
    price: 1599,
    sku: 'CW2288-111',
    colorway: 'White / White / White',
    releaseDate: '2025-05-15',
    description: 'The radiance lives on in the Nike Air Force 1 \'07, the b-ball icon that puts a fresh spin on what you know best: crisp leather, bold details and the perfect amount of flash.',
    details: [
      'Stitched leather overlays on the upper add heritage style, durability and support',
      'Nike Air cushioning adds lightweight, all-day comfort',
      'Low-cut silhouette adds a clean, streamlined look',
      'Padded collar feels soft and comfortable'
    ],
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85'
    ],
    sizes: [
      { size: 8, stock: 15 },
      { size: 8.5, stock: 20 },
      { size: 9, stock: 25 },
      { size: 9.5, stock: 25 },
      { size: 10, stock: 20 },
      { size: 10.5, stock: 15 },
      { size: 11, stock: 12 },
      { size: 12, stock: 8 }
    ],
    rating: 4.8,
    reviewsCount: 289,
    isFeatured: true,
    isBestSeller: true,
    salesCount: 289,
    tags: ['Essential', 'All-White', 'Bestseller']
  },
  {
    id: 'kixo-dunk-panda-03',
    name: 'Nike Dunk Low Retro "Black / White Panda"',
    brand: 'Nike',
    category: 'Low-Top',
    gender: 'Unisex',
    price: 2299,
    originalPrice: 2599,
    sku: 'DD1391-100',
    colorway: 'White / Black / Total Orange',
    releaseDate: '2025-05-10',
    description: 'Created for the hardwood but taken to the streets, the 80s b-ball icon returns with perfectly shined overlays and classic team colors.',
    details: [
      'Crisp leather upper ages to soft perfection',
      'Durable construction reminiscent of 80s b-ball',
      'Foam midsole offers lightweight, responsive cushioning',
      'Rubber outsole with classic hoops pivot circle'
    ],
    images: [
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=85'
    ],
    sizes: [
      { size: 8, stock: 5 },
      { size: 8.5, stock: 8 },
      { size: 9, stock: 10 },
      { size: 9.5, stock: 12 },
      { size: 10, stock: 9 },
      { size: 10.5, stock: 4 },
      { size: 11, stock: 5 }
    ],
    rating: 4.7,
    reviewsCount: 245,
    isFeatured: true,
    isBestSeller: true,
    salesCount: 245,
    tags: ['Panda Dunk', 'Streetwear', 'Deadstock']
  },
  {
    id: 'kixo-aj4-black-cat-04',
    name: 'Air Jordan 4 Retro "Black Cat"',
    brand: 'Jordan',
    category: 'High-Top',
    gender: 'Men',
    price: 3499,
    originalPrice: 3899,
    sku: 'CU1110-010',
    colorway: 'Black / Black / Light Graphite',
    releaseDate: '2025-04-28',
    description: 'Stealth luxury redefined. The Air Jordan 4 "Black Cat" arrives in a triple black nubuck finish with glossy eyelets and iconic mesh side netting.',
    details: [
      'Premium matte black nubuck upper',
      'Molded plastic eyestays and heel tab',
      'Visible Air unit in heel and encapsulated forefoot Air',
      'Herringbone traction rubber outsole'
    ],
    images: [
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=1000&q=85',
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85'
    ],
    sizes: [
      { size: 8.5, stock: 2 },
      { size: 9, stock: 4 },
      { size: 9.5, stock: 6 },
      { size: 10, stock: 5 },
      { size: 10.5, stock: 3 },
      { size: 11, stock: 1 }
    ],
    rating: 5.0,
    reviewsCount: 210,
    isFeatured: true,
    isBestSeller: true,
    salesCount: 210,
    tags: ['Vault Grail', 'Triple Black', 'AJ4 Classic']
  },
  {
    id: 'kixo-nb-550-05',
    name: 'New Balance 550 "White Grey"',
    brand: 'New Balance',
    category: 'Lifestyle',
    gender: 'Unisex',
    price: 1899,
    sku: 'BB550PB1',
    colorway: 'Sea Salt / White / Rain Cloud',
    releaseDate: '2025-05-02',
    description: 'Simple & clean vintage basketball sneaker inspired by the 1989 archival release. Premium leather upper with suede accents.',
    details: [
      'Full leather upper with perforated midfoot panels',
      'Padded collar and breathable mesh tongue',
      'Rubber cupsole for traction and durability',
      'Embossed 550 logo on lateral toe'
    ],
    images: [
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1000&q=85'
    ],
    sizes: [
      { size: 8, stock: 6 },
      { size: 8.5, stock: 8 },
      { size: 9, stock: 10 },
      { size: 9.5, stock: 9 },
      { size: 10, stock: 7 },
      { size: 11, stock: 4 }
    ],
    rating: 4.8,
    reviewsCount: 168,
    isFeatured: false,
    isBestSeller: true,
    salesCount: 168,
    tags: ['Retro Court', 'Vintage Aesthetic']
  },
  {
    id: 'kixo-adidas-samba-06',
    name: 'Adidas Samba OG "Cloud White / Core Black"',
    brand: 'Adidas',
    category: 'Lifestyle',
    gender: 'Unisex',
    price: 1799,
    sku: 'B75806',
    colorway: 'Cloud White / Core Black / Gum',
    releaseDate: '2025-04-12',
    description: 'Born on the pitch, the Samba is a timeless icon of street style. This version stays true to its legacy with a supple leather upper and suede overlays.',
    details: [
      'Full grain leather upper with gritty suede T-toe overlay',
      'Soft leather lining for step-in comfort',
      'Gum rubber cupsole with pivot point',
      'Gold foil Samba metallic branding'
    ],
    images: [
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=1000&q=85'
    ],
    sizes: [
      { size: 7.5, stock: 4 },
      { size: 8, stock: 6 },
      { size: 8.5, stock: 10 },
      { size: 9, stock: 12 },
      { size: 9.5, stock: 10 },
      { size: 10, stock: 6 },
      { size: 11, stock: 3 }
    ],
    rating: 4.9,
    reviewsCount: 195,
    isFeatured: false,
    isBestSeller: true,
    salesCount: 195,
    tags: ['Terrace Icon', 'Gum Sole']
  },
  {
    id: 'kixo-puma-suede-07',
    name: 'Puma Suede Classic XXI "Black / White"',
    brand: 'Puma',
    category: 'Lifestyle',
    gender: 'Unisex',
    price: 1299,
    sku: '374915-01',
    colorway: 'Puma Black / Puma White',
    releaseDate: '2025-04-01',
    description: 'The Suede hit the scene in 1968 and has been changing the game ever since. Made with classic suede upper and modern comfort elements.',
    details: [
      'Full suede upper with synthetic lining',
      'Comfort sockliner for instant cushioning',
      'Rubber midsole and outsole for grip',
      'Puma Formstrip on medial and lateral sides'
    ],
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85'
    ],
    sizes: [
      { size: 8, stock: 7 },
      { size: 8.5, stock: 9 },
      { size: 9, stock: 11 },
      { size: 9.5, stock: 10 },
      { size: 10, stock: 8 },
      { size: 11, stock: 5 }
    ],
    rating: 4.6,
    reviewsCount: 92,
    isFeatured: false,
    salesCount: 92,
    tags: ['B-Boy Classic', 'Heritage Suede']
  },
  {
    id: 'kixo-vans-oldskool-08',
    name: 'Vans Old Skool Classic "Black / White"',
    brand: 'Vans',
    category: 'Low-Top',
    gender: 'Unisex',
    price: 1199,
    sku: 'VN000D3HY28',
    colorway: 'Black / True White',
    releaseDate: '2025-03-25',
    description: 'First known as the Vans #36, the Old Skool debuted in 1977 with a unique new addition: a random doodle drawn by founder Paul Van Doren.',
    details: [
      'Sturdy suede and canvas uppers',
      'Reinforced toe caps to withstand repeated wear',
      'Supportive padded collars',
      'Signature rubber waffle outsoles'
    ],
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1000&q=85'
    ],
    sizes: [
      { size: 7.5, stock: 8 },
      { size: 8, stock: 12 },
      { size: 8.5, stock: 14 },
      { size: 9, stock: 15 },
      { size: 9.5, stock: 12 },
      { size: 10, stock: 10 },
      { size: 11, stock: 6 }
    ],
    rating: 4.8,
    reviewsCount: 140,
    isFeatured: false,
    salesCount: 140,
    tags: ['Skate Classic', 'Sidestripe']
  },
  {
    id: 'kixo-converse-chuck70-09',
    name: 'Converse Chuck 70 Vintage Canvas High',
    brand: 'Converse',
    category: 'High-Top',
    gender: 'Unisex',
    price: 1399,
    sku: '162050C',
    colorway: 'Black / Egret / Black',
    releaseDate: '2025-03-20',
    description: 'By 1970, the Chuck Taylor All Star evolved into one of the best basketball sneakers, ever. The Chuck 70 celebrates that heritage by bringing together archival-inspired details.',
    details: [
      'Crafted in premium 12oz canvas for elevated feel',
      'OrthoLite insole cushioning for all-day arch support',
      'Higher, glossy egret rubber sidewall and winged tongue stitching',
      'Vintage license plate and heritage star ankle patch'
    ],
    images: [
      'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=1000&q=85'
    ],
    sizes: [
      { size: 7.5, stock: 6 },
      { size: 8, stock: 10 },
      { size: 8.5, stock: 12 },
      { size: 9, stock: 14 },
      { size: 9.5, stock: 11 },
      { size: 10, stock: 8 },
      { size: 11, stock: 5 }
    ],
    rating: 4.9,
    reviewsCount: 180,
    isFeatured: false,
    salesCount: 180,
    tags: ['Heritage High', 'Chuck 70']
  },
  {
    id: 'kixo-travis-mocha-10',
    name: 'Travis Scott x Air Jordan 1 Low OG "Reverse Mocha"',
    brand: 'Travis Scott',
    category: 'Limited Edition',
    gender: 'Unisex',
    price: 4299,
    originalPrice: 4899,
    sku: 'DM7866-162',
    colorway: 'Sail / University Red / Ridgerock',
    releaseDate: '2025-04-18',
    description: 'Cactus Jack signature inverted oversized Swoosh with rich Ridgerock nubuck, crisp white leather overlays, and vintage yellowed midsole.',
    details: [
      'Oversized inverted lateral leather Swoosh',
      'Cactus Jack embroidery on heel and inner tongue',
      'Aged sail midsole with matching waxed laces',
      'Vault NFC Security Authenticity Tag included'
    ],
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85'
    ],
    sizes: [
      { size: 8.5, stock: 2 },
      { size: 9, stock: 3 },
      { size: 9.5, stock: 4 },
      { size: 10, stock: 3 },
      { size: 10.5, stock: 2 }
    ],
    rating: 5.0,
    reviewsCount: 420,
    isFeatured: true,
    isBestSeller: true,
    salesCount: 420,
    tags: ['Cactus Jack', 'Vault Grail', 'Reverse Mocha']
  }
];

export const INITIAL_DROPS: Drop[] = [
  {
    id: 'drop-01',
    sneakerName: 'Air Jordan 1 High "Shattered Backboard 4.0"',
    brand: 'Jordan',
    price: 3299,
    releaseTime: '2026-08-20T17:00:00Z',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=85',
    hypeLevel: 'GRAIL',
    type: 'Raffle Draw',
    description: 'Official Kixora Draw. 500 pairs worldwide allocated with NFC verification certificates and custom wooden crate packaging.',
    subscribersCount: 14820,
    isNotified: false
  },
  {
    id: 'drop-02',
    sneakerName: 'Travis Scott x Nike Mac Attack "Dark Obsidian"',
    brand: 'Travis Scott',
    price: 3899,
    releaseTime: '2026-08-23T15:00:00Z',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85',
    hypeLevel: 'EXTREME',
    type: 'Shock Drop',
    description: 'Shock Drop releasing exclusively on Kixora Vault. Instant push alert to registered hype tier members.',
    subscribersCount: 22100,
    isNotified: true
  },
  {
    id: 'drop-03',
    sneakerName: 'Nike Dunk Low SB x Born x Raised "One Block at a Time"',
    brand: 'Nike',
    price: 2799,
    releaseTime: '2026-08-28T18:00:00Z',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=85',
    hypeLevel: 'HIGH',
    type: 'Vault Exclusive',
    description: 'Holographic swoosh details, custom perforated toe box, and embroidered heel motto honoring Venice Beach street culture.',
    subscribersCount: 9450,
    isNotified: false
  }
];

export const INITIAL_PROMOS: PromoCode[] = [
  {
    id: 'promo-01',
    code: 'KIX10',
    discountPercent: 10,
    minSpend: 1000,
    description: '10% off for verified culture members on orders over R1,000',
    isActive: true
  },
  {
    id: 'promo-02',
    code: 'VAULT20',
    discountPercent: 20,
    minSpend: 2500,
    description: '20% off grail purchases over R2,500',
    isActive: true
  },
  {
    id: 'promo-03',
    code: 'SNEAKERHEAD15',
    discountPercent: 15,
    minSpend: 1500,
    description: '15% off any seasonal drop',
    isActive: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'KXO-1048',
    trackingNumber: 'KX-77291048-ZA',
    createdAt: '2025-05-27T10:30:00Z',
    customer: {
      fullName: 'Lerato M.',
      email: 'lerato.m@culture.co.za',
      phone: '+27 82 555 0192',
      street: '142 Sandton Drive, Suite 402',
      city: 'Johannesburg',
      state: 'Gauteng',
      zip: '2196',
      country: 'South Africa'
    },
    items: [
      {
        id: 'item-01',
        sneaker: INITIAL_SNEAKERS[0], // Shattered Backboard
        selectedSize: 10,
        quantity: 1
      }
    ],
    subtotal: 2999,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    total: 2999,
    status: 'Delivered',
    paymentMethod: 'Credit Card (3D Secure)',
    shippingMethod: 'Express Courier (Free Over R2,000)',
    timeline: [
      {
        title: 'Delivered & Signed',
        timestamp: 'May 27, 2025 - 14:15',
        description: 'Package handed over and signed by recipient Lerato M.',
        completed: true
      },
      {
        title: 'Out for Delivery',
        timestamp: 'May 27, 2025 - 08:30',
        description: 'Courier vehicle dispatched from Sandton Hub',
        completed: true
      },
      {
        title: '12-Point Authentication Passed',
        timestamp: 'May 26, 2025 - 16:45',
        description: 'Passed blacklight UV test, leather grain inspection & stitch check. NFC Tag KX-992 affixed.',
        completed: true
      },
      {
        title: 'Order Confirmed & Payment Verified',
        timestamp: 'May 26, 2025 - 10:30',
        description: 'Payment authorized via 3D Secure gateway',
        completed: true
      }
    ]
  },
  {
    id: 'KXO-1047',
    trackingNumber: 'KX-88191047-ZA',
    createdAt: '2025-05-27T09:12:00Z',
    customer: {
      fullName: 'Thabo K.',
      email: 'thabo.k@grailclub.co.za',
      phone: '+27 71 888 4412',
      street: '88 Long Street',
      city: 'Cape Town',
      state: 'Western Cape',
      zip: '8001',
      country: 'South Africa'
    },
    items: [
      {
        id: 'item-02',
        sneaker: INITIAL_SNEAKERS[1], // AF1 White
        selectedSize: 9.5,
        quantity: 1
      }
    ],
    subtotal: 1599,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    total: 1599,
    status: 'Processing',
    paymentMethod: 'Apple Pay',
    shippingMethod: 'Standard Courier',
    timeline: [
      {
        title: 'Vault Packaging & Box Inspection',
        timestamp: 'May 27, 2025 - 11:00',
        description: 'Secured inside Kixora double-boxed shipping shell with bubble wrap',
        completed: true
      },
      {
        title: 'Authentication Inspection in Progress',
        timestamp: 'May 27, 2025 - 09:40',
        description: 'Authenticity verifiers inspecting box label, SKU and stitch tension',
        completed: true
      },
      {
        title: 'Order Placed',
        timestamp: 'May 27, 2025 - 09:12',
        description: 'Order received into Vault queue',
        completed: true
      }
    ]
  },
  {
    id: 'KXO-1046',
    trackingNumber: 'KX-99201046-ZA',
    createdAt: '2025-05-27T08:04:00Z',
    customer: {
      fullName: 'Sipho D.',
      email: 'sipho.d@kixmail.com',
      phone: '+27 83 222 9011',
      street: '22 Florida Road',
      city: 'Durban',
      state: 'KwaZulu-Natal',
      zip: '4001',
      country: 'South Africa'
    },
    items: [
      {
        id: 'item-03',
        sneaker: INITIAL_SNEAKERS[2], // Panda Dunk
        selectedSize: 9,
        quantity: 1
      }
    ],
    subtotal: 2299,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    total: 2299,
    status: 'Shipped',
    paymentMethod: 'Instant EFT',
    shippingMethod: 'Priority Vault Express',
    timeline: [
      {
        title: 'In Transit to Regional Distribution Hub',
        timestamp: 'May 27, 2025 - 10:15',
        description: 'Sorted at main logistics depot and scanned for road freight transit',
        completed: true
      },
      {
        title: '12-Point Authentication Passed',
        timestamp: 'May 27, 2025 - 08:45',
        description: '100% Deadstock Verified. NFC tag KX-1046 encoded.',
        completed: true
      }
    ]
  },
  {
    id: 'KXO-1045',
    trackingNumber: 'KX-66291045-ZA',
    createdAt: '2025-05-26T16:20:00Z',
    customer: {
      fullName: 'Amanda P.',
      email: 'amanda.p@vault.com',
      phone: '+27 84 901 3345',
      street: '15 Ocean View Terrace',
      city: 'Umhlanga',
      state: 'KwaZulu-Natal',
      zip: '4319',
      country: 'South Africa'
    },
    items: [
      {
        id: 'item-04',
        sneaker: INITIAL_SNEAKERS[3], // Jordan 4 Black Cat
        selectedSize: 10,
        quantity: 1
      }
    ],
    subtotal: 3499,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    total: 3499,
    status: 'Delivered',
    paymentMethod: 'Credit Card',
    shippingMethod: 'Express Courier',
    timeline: [
      {
        title: 'Delivered & Verified',
        timestamp: 'May 27, 2025 - 12:00',
        description: 'Received by customer',
        completed: true
      }
    ]
  },
  {
    id: 'KXO-1044',
    trackingNumber: 'KX-55191044-ZA',
    createdAt: '2025-05-26T14:10:00Z',
    customer: {
      fullName: 'Jason L.',
      email: 'jason.l@outlook.com',
      phone: '+27 72 443 1190',
      street: '45 Kloof Street',
      city: 'Cape Town',
      state: 'Western Cape',
      zip: '8001',
      country: 'South Africa'
    },
    items: [
      {
        id: 'item-05',
        sneaker: INITIAL_SNEAKERS[6], // Puma Suede
        selectedSize: 9.5,
        quantity: 1
      }
    ],
    subtotal: 1299,
    discount: 0,
    shippingFee: 0,
    tax: 0,
    total: 1299,
    status: 'Processing',
    paymentMethod: 'Card',
    shippingMethod: 'Standard',
    timeline: [
      {
        title: 'Packaging in Progress',
        timestamp: 'May 26, 2025 - 15:00',
        description: 'Preparing for courier handover',
        completed: true
      }
    ]
  }
];
