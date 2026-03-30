export const feedPosts = [
  {
    id: 1,
    seller: {
      name: "Sarah Mitchell",
      username: "sarahstyle",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
      verified: true,
      isFollowing: true,
    },
    content: {
      type: "image" as const,
      media: [
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1000&fit=crop",
      ],
      caption: "Fall vibes with my new favorite jacket 🍂 Obsessed with this collection! Link in bio for the full outfit details. #FallFashion #OOTD",
    },
    product: {
      id: 1,
      name: "Wool Blend Coat",
      price: 189,
    },
    engagement: {
      likes: 24532,
      comments: 892,
      shares: 156,
    },
    commentsList: [
      {
        id: 1,
        username: "fashionista99",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
        text: "Omg I absolutely need this coat! Is it true to size? 😍",
        timeAgo: "1h",
        likes: 45,
      },
      {
        id: 2,
        username: "styleicon_ng",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop",
        text: "The styling is impeccable. Autumn perfection. 🍂",
        timeAgo: "30m",
        likes: 12,
      }
    ],
    isLiked: false,
    isSaved: false,
    timeAgo: "2h ago",
  },
  {
    id: 2,
    seller: {
      name: "TechReviews",
      username: "techreviews",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
      verified: true,
      isFollowing: true,
    },
    content: {
      type: "carousel" as const,
      media: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=1000&fit=crop",
      ],
      caption: "Finally got my hands on these! The sound quality is absolutely incredible. Perfect for my daily commute. Full review dropping tomorrow 🎧",
    },
    product: {
      id: 3,
      name: "Pro Headphones",
      price: 349,
    },
    engagement: {
      likes: 18943,
      comments: 1243,
      shares: 423,
    },
    commentsList: [
      {
        id: 3,
        username: "audiophile_guy",
        avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=80&h=80&fit=crop",
        text: "How does the noise cancellation compare to the Sony XM5s?",
        timeAgo: "2h",
        likes: 156,
      }
    ],
    isLiked: true,
    isSaved: true,
    timeAgo: "4h ago",
  },
  {
    id: 3,
    seller: {
      name: "HomeVibes",
      username: "homevibes",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
      verified: false,
      isFollowing: false,
    },
    content: {
      type: "image" as const,
      media: [
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=1000&fit=crop",
      ],
      caption: "Finally finished our living room makeover! What do you think? 🏠✨ Swipe for the before photo. Everything is linked below!",
    },
    product: {
      id: 4,
      name: "Velvet Sofa",
      price: 1299,
    },
    engagement: {
      likes: 12876,
      comments: 567,
      shares: 234,
    },
    isLiked: false,
    isSaved: false,
    timeAgo: "6h ago",
  },
  {
    id: 4,
    seller: {
      name: "Nike",
      username: "nike",
      avatar: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop",
      verified: true,
      isFollowing: true,
    },
    content: {
      type: "video" as const,
      media: [
        "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=1000&fit=crop",
      ],
      caption: "Introducing the new Air Max 2026. Designed for comfort, built for performance. Available now. #JustDoIt",
    },
    product: {
      id: 7,
      name: "Air Max 2026",
      price: 199,
    },
    engagement: {
      likes: 89234,
      comments: 4521,
      shares: 2156,
    },
    isLiked: false,
    isSaved: true,
    timeAgo: "8h ago",
  },
  {
    id: 5,
    seller: {
      name: "Alex Photography",
      username: "alexphotography",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
      verified: true,
      isFollowing: false,
    },
    content: {
      type: "carousel" as const,
      media: [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=1000&fit=crop",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=1000&fit=crop",
      ],
      caption: "My everyday carry for street photography 📷 This setup has completely changed how I shoot. What camera do you use?",
    },
    product: {
      id: 8,
      name: "Mirrorless Camera",
      price: 1999,
    },
    engagement: {
      likes: 7654,
      comments: 423,
      shares: 89,
    },
    isLiked: true,
    isSaved: false,
    timeAgo: "12h ago",
  },
]
