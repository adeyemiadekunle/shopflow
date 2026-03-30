export type SellerSummary = {
  slug: string;
  name: string;
  avatar: string;
  verified: boolean;
  location: string;
  headline: string;
  tags: string[];
};

export type FeedProduct = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  gallery: string[];
  deliveryEstimate: string;
  likes: string;
  comments: string;
  saves: string;
  mediaType: "image" | "video";
  seller: SellerSummary;
  rating: number;
  reviewCount: number;
  tags: string[];
  highlights: string[];
  variants: {
    colors: string[];
    sizes: string[];
  };
  reviews: Array<{
    author: string;
    date: string;
    body: string;
  }>;
};

type StoreProfile = SellerSummary & {
  bio: string;
  banner: string;
  followers: string;
  rating: number;
  responseTime: string;
  serviceHighlights: Array<{
    title: string;
    detail: string;
  }>;
  collections: Array<{
    name: string;
    description: string;
    itemCount: string;
  }>;
  recentPosts: Array<{
    caption: string;
    engagement: string;
  }>;
};

type InboxConversation = {
  id: string;
  seller: SellerSummary;
  preview: string;
  lastMessageAt: string;
  onlineStatus: string;
  product: {
    title: string;
    price: string;
    href: string;
  };
  messages: Array<{
    author: "buyer" | "seller";
    body: string;
    timestamp: string;
  }>;
};

const sellers: StoreProfile[] = [
  {
    slug: "kosi-market",
    name: "Kosi Market",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
    verified: true,
    location: "Yaba, Lagos",
    headline: "Daily fashion drops with ready-to-ship sizing and fast seller replies.",
    tags: ["Verified seller", "Ready to ship", "Lagos delivery"],
    bio: "Kosi Market blends social content with everyday style drops so buyers can trust the fit before checkout.",
    banner:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80",
    followers: "24.5k",
    rating: 4.8,
    responseTime: "< 10 min",
    serviceHighlights: [
      {
        title: "Protected checkout",
        detail: "Buyers see refunds and delivery expectations before they pay.",
      },
      {
        title: "Ready to ship",
        detail: "Best sellers are packed for same-day dispatch within Lagos.",
      },
      {
        title: "Responsive seller",
        detail: "Product questions are answered in chat with context from the pinned item.",
      },
    ],
    collections: [
      {
        name: "Weekend drop",
        description: "Statement outfits, video-first merchandising, and soft neutrals.",
        itemCount: "12",
      },
      {
        name: "Office-ready",
        description: "Structured pieces for buyers who want polished looks without custom tailoring delays.",
        itemCount: "9",
      },
      {
        name: "Fast sellers",
        description: "Items with the fastest repeat purchase rate and the most saves this week.",
        itemCount: "6",
      },
    ],
    recentPosts: [
      {
        caption: "New Ankara textures just landed for the weekend edit.",
        engagement: "1.4k likes · 126 comments",
      },
      {
        caption: "Sizing guide in stories for everyone asking about the wide-leg fit.",
        engagement: "930 likes · 71 replies",
      },
    ],
  },
  {
    slug: "volt-living",
    name: "Volt Living",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
    verified: true,
    location: "Lekki, Lagos",
    headline: "Home tech and lifestyle upgrades with crisp delivery messaging.",
    tags: ["Verified seller", "Pickup available", "Trusted returns"],
    bio: "Volt Living curates small home upgrades and tech accessories for buyers who care about credibility, clean visuals, and quick fulfillment.",
    banner:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
    followers: "11.2k",
    rating: 4.7,
    responseTime: "< 20 min",
    serviceHighlights: [
      {
        title: "Protected checkout",
        detail: "Payment confirmation and order verification stay visible through delivery.",
      },
      {
        title: "Pickup ready",
        detail: "Lagos buyers can choose quick pickup or standard dispatch.",
      },
      {
        title: "Supportive seller",
        detail: "Buyers get fast follow-up for installation or product fit questions.",
      },
    ],
    collections: [
      {
        name: "Desk refresh",
        description: "Calm, compact accessories for remote work setups.",
        itemCount: "8",
      },
      {
        name: "Home comfort",
        description: "Warm lighting, soft textures, and starter bundles.",
        itemCount: "11",
      },
      {
        name: "Small electronics",
        description: "Clean utility products designed for repeat use.",
        itemCount: "7",
      },
    ],
    recentPosts: [
      {
        caption: "Night routine lighting that actually makes your room feel finished.",
        engagement: "840 likes · 49 comments",
      },
      {
        caption: "Buyers asked for cable management that does not look industrial. Here it is.",
        engagement: "620 likes · 23 comments",
      },
    ],
  },
];

const products: FeedProduct[] = [
  {
    slug: "ankara-drop-set",
    title: "Ankara Drop Set",
    summary: "A content-led matching set styled for scroll-stopping product discovery.",
    description:
      "This product detail layout keeps the image dominant, the trust cues visible, and the buy actions easy to reach on mobile. It is built to convert from content, not just catalog browsing.",
    price: 28500,
    originalPrice: 32000,
    category: "Clothing",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    ],
    deliveryEstimate: "Delivers in 24-48 hrs",
    likes: "3.2k",
    comments: "218",
    saves: "1.1k",
    mediaType: "video",
    seller: sellers[0],
    rating: 4.8,
    reviewCount: 142,
    tags: ["Ready to ship", "Verified seller", "Under ₦30k"],
    highlights: [
      "Variants, review count, delivery timing, and seller verification all sit above the fold.",
      "Social proof from likes, comments, and saves stays visible without overpowering the price.",
      "Chat entry remains one tap away for trust-first markets where buyers want reassurance.",
    ],
    variants: {
      colors: ["Sunset Clay", "Deep Indigo", "Palm Green"],
      sizes: ["S", "M", "L", "XL"],
    },
    reviews: [
      {
        author: "Chioma O.",
        date: "2 days ago",
        body: "The fit matched the video and the seller answered my size question in minutes.",
      },
      {
        author: "Adaeze M.",
        date: "1 week ago",
        body: "Packaging was clean, delivery was fast, and the return information was easy to find.",
      },
    ],
  },
  {
    slug: "soft-step-slides",
    title: "Soft Step Slides",
    summary: "Everyday slides with a clean visual and clear delivery promise.",
    description:
      "Footwear works well in the feed when the image stays large, trust stays visible, and the store context feels immediate rather than hidden behind extra taps.",
    price: 14500,
    category: "Footwear",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
    ],
    deliveryEstimate: "Pickup or next-day dispatch",
    likes: "1.8k",
    comments: "96",
    saves: "640",
    mediaType: "image",
    seller: sellers[0],
    rating: 4.6,
    reviewCount: 84,
    tags: ["Ready to ship", "Pickup available"],
    highlights: [
      "Product cards keep the value proposition crisp enough for quick comparison scrolling.",
      "Store identity remains near the product so buyers keep trusting the seller behind the offer.",
      "The CTA cluster supports view product, save, and cart without crowding the image.",
    ],
    variants: {
      colors: ["Cream", "Charcoal", "Sand"],
      sizes: ["39", "40", "41", "42"],
    },
    reviews: [
      {
        author: "Tolu J.",
        date: "5 days ago",
        body: "Exactly what I wanted for everyday wear and the pickup option saved time.",
      },
      {
        author: "Bola A.",
        date: "2 weeks ago",
        body: "Seller responded quickly about sizing and the pair looked just like the photos.",
      },
    ],
  },
  {
    slug: "halo-lamp-mini",
    title: "Halo Lamp Mini",
    summary: "Warm accent lighting for bedrooms, desks, and creator corners.",
    description:
      "This product proves the app can handle lifestyle and electronics categories without changing the overall shell. Trust, delivery, and checkout cues stay consistent across verticals.",
    price: 22750,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
    ],
    deliveryEstimate: "Ships in 48 hrs",
    likes: "980",
    comments: "54",
    saves: "410",
    mediaType: "image",
    seller: sellers[1],
    rating: 4.7,
    reviewCount: 58,
    tags: ["Trusted returns", "Under ₦25k"],
    highlights: [
      "A single product system can support fashion, home, beauty, and electronics.",
      "Strong image hierarchy keeps the feed feeling premium before a final brand system is locked.",
      "Trust messaging scales from the homepage into product detail and checkout.",
    ],
    variants: {
      colors: ["Warm White", "Smoked Amber"],
      sizes: ["Mini", "Standard"],
    },
    reviews: [
      {
        author: "Femi N.",
        date: "3 days ago",
        body: "The color temperature is perfect and the seller gave a quick installation tip in chat.",
      },
      {
        author: "Lami R.",
        date: "9 days ago",
        body: "Clean design and the delivery timing was exactly what the product page promised.",
      },
    ],
  },
];

function delay(milliseconds = 180) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getStoreBySlug(slug: string) {
  return sellers.find((seller) => seller.slug === slug);
}

export function getProductsForStore(slug: string) {
  return products.filter((product) => product.seller.slug === slug);
}

export async function getHomeFeed() {
  await delay();

  return {
    categories: ["All", "Clothing", "Footwear", "Electronics", "Beauty", "Home"],
    products,
    trustPoints: ["Verified sellers", "Buyer protection", "Saved carts persist locally"],
    readiness: [
      {
        label: "Responsive shell",
        detail: "Mobile bottom nav and desktop side rail share the same route structure.",
      },
      {
        label: "Theme tokens",
        detail: "Primary color swaps update buttons, highlights, and trust cues across the app.",
      },
      {
        label: "API-ready data layer",
        detail: "React Query is wired so we can swap mock functions for real endpoints next.",
      },
    ],
  };
}

export async function getSearchIndex() {
  await delay();

  return {
    filters: ["All", "Verified seller", "Ready to ship", "Pickup available", "Under ₦25k"],
    products,
    sellers,
  };
}

export async function getInboxData() {
  await delay();

  const conversations: InboxConversation[] = [
    {
      id: "conv-kosi",
      seller: sellers[0],
      preview: "Yes, the medium and large sizes are still available right now.",
      lastMessageAt: "5m ago",
      onlineStatus: "Online",
      product: {
        title: "Ankara Drop Set",
        price: "₦28,500",
        href: "/product/ankara-drop-set",
      },
      messages: [
        {
          author: "buyer",
          body: "Hi, is the Deep Indigo color still available in medium?",
          timestamp: "11:02",
        },
        {
          author: "seller",
          body: "Yes, medium and large are still available. Delivery in Lagos can happen tomorrow.",
          timestamp: "11:04",
        },
        {
          author: "buyer",
          body: "Perfect. Can you share if the trousers run true to size?",
          timestamp: "11:05",
        },
        {
          author: "seller",
          body: "Yes, they do. If you are between sizes, I would recommend sizing up for a looser fit.",
          timestamp: "11:06",
        },
      ],
    },
    {
      id: "conv-volt",
      seller: sellers[1],
      preview: "We can include the installation guide in the order notes.",
      lastMessageAt: "1h ago",
      onlineStatus: "Replies in under 20 min",
      product: {
        title: "Halo Lamp Mini",
        price: "₦22,750",
        href: "/product/halo-lamp-mini",
      },
      messages: [
        {
          author: "buyer",
          body: "Can I use this lamp on a bedside table without the room getting too bright?",
          timestamp: "09:12",
        },
        {
          author: "seller",
          body: "Yes, the mini version is designed for warm ambient lighting. We can include the setup tips too.",
          timestamp: "09:18",
        },
      ],
    },
  ];

  return {
    conversations,
    quickActions: [
      "Is this available?",
      "What sizes do you have?",
      "How long is delivery?",
      "Can I see more photos?",
    ],
  };
}

export async function getCartData() {
  await delay();

  return {
    sellerName: "Kosi Market",
    items: [
      {
        title: "Ankara Drop Set",
        variant: "Deep Indigo · M",
        quantity: 1,
        price: 28500,
        deliveryEstimate: "Delivers in 24-48 hrs",
        image: products[0].image,
      },
      {
        title: "Soft Step Slides",
        variant: "Cream · 41",
        quantity: 1,
        price: 14500,
        deliveryEstimate: "Pickup or next-day dispatch",
        image: products[1].image,
      },
    ],
    address: {
      name: "Primary address",
      detail: "12 Hughes Avenue, Sabo, Yaba, Lagos · Buyer protection is applied to this order.",
    },
    shippingMethods: [
      {
        name: "Standard dispatch",
        detail: "24-48 hrs within Lagos with tracking after drop-off.",
      },
      {
        name: "Pickup option",
        detail: "Schedule pickup directly with the seller after order confirmation.",
      },
    ],
    paymentMethods: [
      {
        name: "Card or transfer",
        detail: "Use the configured provider and return to the order page for verification.",
      },
      {
        name: "Protected checkout",
        detail: "Seller payout stays on hold until delivery is confirmed or the return window closes.",
      },
    ],
    summary: {
      subtotal: 43000,
      delivery: 3500,
      protection: 500,
      total: 47000,
    },
    protectionPoints: [
      "Estimated delivery stays visible before payment is made.",
      "Refund and return policy remain one tap away from the summary.",
      "Checkout is intentionally short for mobile buyers and weaker networks.",
    ],
  };
}

export async function getProfileData() {
  await delay();

  return {
    name: "Maya Okafor",
    handle: "@maya.okafor",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
    tier: "Buyer since 2026",
    stats: {
      orders: "14",
      saved: "37",
      addresses: "3",
    },
    orders: [
      {
        id: "RND-2041",
        seller: "Kosi Market",
        status: "In transit",
        total: "₦47,000",
      },
      {
        id: "RND-1987",
        seller: "Volt Living",
        status: "Completed",
        total: "₦22,750",
      },
      {
        id: "RND-1944",
        seller: "Kosi Market",
        status: "Completed",
        total: "₦14,500",
      },
    ],
    addresses: [
      {
        name: "Home",
        detail: "12 Hughes Avenue, Sabo, Yaba, Lagos",
      },
      {
        name: "Office",
        detail: "3A Admiralty Way, Lekki Phase 1, Lagos",
      },
    ],
  };
}
