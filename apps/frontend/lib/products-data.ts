export type Product = {
  id: number
  name: string
  brand: string
  price: number
  originalPrice?: number
  image: string
  images: string[]
  rating: number
  reviews: number
  category: string
  tags: string[]
  description: string
  seller: {
    name: string
    username: string
    avatar: string
    verified: boolean
  }
  inStock: boolean
  sizes?: string[]
  colors?: { name: string; hex: string }[]
}

export const categories = [
  { id: "all", name: "All", icon: "Grid3X3" },
  { id: "fashion", name: "Fashion", icon: "Shirt" },
  { id: "electronics", name: "Electronics", icon: "Smartphone" },
  { id: "home", name: "Home", icon: "Home" },
  { id: "beauty", name: "Beauty", icon: "Sparkles" },
  { id: "sports", name: "Sports", icon: "Dumbbell" },
  { id: "accessories", name: "Accessories", icon: "Watch" },
]

export const products: Product[] = [
  {
    id: 1,
    name: "Minimalist Watch",
    brand: "Nordgreen",
    price: 229,
    originalPrice: 299,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=800&fit=crop",
    ],
    rating: 4.9,
    reviews: 1243,
    category: "accessories",
    tags: ["watch", "minimalist", "luxury"],
    description: "A beautifully crafted minimalist watch with Scandinavian design. Features a Japanese quartz movement and sapphire crystal glass.",
    seller: {
      name: "Alex Style",
      username: "alexstyle",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    colors: [
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Gold", hex: "#FFD700" },
      { name: "Rose Gold", hex: "#B76E79" },
    ],
  },
  {
    id: 2,
    name: "Wireless Earbuds Pro",
    brand: "SoundCore",
    price: 79,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
    ],
    rating: 4.7,
    reviews: 892,
    category: "electronics",
    tags: ["audio", "wireless", "earbuds"],
    description: "Premium wireless earbuds with active noise cancellation and 40-hour battery life.",
    seller: {
      name: "Tech Guru",
      username: "techguru",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    colors: [
      { name: "Black", hex: "#000000" },
      { name: "White", hex: "#FFFFFF" },
    ],
  },
  {
    id: 3,
    name: "Canvas Sneakers",
    brand: "Veja",
    price: 145,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop",
    ],
    rating: 4.8,
    reviews: 2156,
    category: "fashion",
    tags: ["shoes", "sneakers", "sustainable"],
    description: "Sustainable canvas sneakers made from organic cotton and wild rubber from the Amazon.",
    seller: {
      name: "Fashion Mike",
      username: "fashionmike",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    sizes: ["7", "8", "9", "10", "11", "12"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Black", hex: "#000000" },
      { name: "Navy", hex: "#000080" },
    ],
  },
  {
    id: 4,
    name: "Leather Crossbody Bag",
    brand: "Madewell",
    price: 168,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop",
    ],
    rating: 4.6,
    reviews: 567,
    category: "accessories",
    tags: ["bag", "leather", "crossbody"],
    description: "Premium leather crossbody bag with adjustable strap and multiple compartments.",
    seller: {
      name: "Sarah Style",
      username: "stylewithsara",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    colors: [
      { name: "Brown", hex: "#8B4513" },
      { name: "Black", hex: "#000000" },
      { name: "Tan", hex: "#D2B48C" },
    ],
  },
  {
    id: 5,
    name: "Ceramic Vase Set",
    brand: "West Elm",
    price: 89,
    image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&h=800&fit=crop",
    ],
    rating: 4.9,
    reviews: 234,
    category: "home",
    tags: ["decor", "vase", "ceramic"],
    description: "Set of 3 handcrafted ceramic vases with minimalist design. Perfect for modern homes.",
    seller: {
      name: "Home Vibes",
      username: "homevibes",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
      verified: false,
    },
    inStock: true,
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Terracotta", hex: "#E2725B" },
    ],
  },
  {
    id: 6,
    name: "Classic Sunglasses",
    brand: "Ray-Ban",
    price: 161,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop",
    ],
    rating: 4.8,
    reviews: 3421,
    category: "accessories",
    tags: ["sunglasses", "classic", "eyewear"],
    description: "Iconic Ray-Ban sunglasses with polarized lenses and UV protection.",
    seller: {
      name: "Summer Ready",
      username: "summerready",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    colors: [
      { name: "Black", hex: "#000000" },
      { name: "Tortoise", hex: "#8B4513" },
    ],
  },
  {
    id: 7,
    name: "Wool Blend Coat",
    brand: "COS",
    price: 250,
    originalPrice: 350,
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&h=800&fit=crop",
    ],
    rating: 4.7,
    reviews: 876,
    category: "fashion",
    tags: ["coat", "winter", "wool"],
    description: "Luxurious wool blend coat perfect for cold weather. Tailored fit with double-breasted closure.",
    seller: {
      name: "Sarah Mitchell",
      username: "sarahstyle",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Camel", hex: "#C19A6B" },
      { name: "Black", hex: "#000000" },
      { name: "Grey", hex: "#808080" },
    ],
  },
  {
    id: 8,
    name: "Pro Headphones",
    brand: "Sony",
    price: 349,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    ],
    rating: 4.9,
    reviews: 2341,
    category: "electronics",
    tags: ["headphones", "audio", "wireless"],
    description: "Industry-leading noise canceling headphones with exceptional sound quality and 30-hour battery.",
    seller: {
      name: "Tech Reviews",
      username: "techreviews",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    colors: [
      { name: "Black", hex: "#000000" },
      { name: "Silver", hex: "#C0C0C0" },
    ],
  },
  {
    id: 9,
    name: "Skincare Set",
    brand: "The Ordinary",
    price: 65,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop",
    ],
    rating: 4.8,
    reviews: 1567,
    category: "beauty",
    tags: ["skincare", "serum", "beauty"],
    description: "Complete skincare routine set including cleanser, serum, and moisturizer.",
    seller: {
      name: "Glow Up",
      username: "glowup",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
  },
  {
    id: 10,
    name: "Yoga Mat Pro",
    brand: "Lululemon",
    price: 98,
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&h=800&fit=crop",
    ],
    rating: 4.9,
    reviews: 789,
    category: "sports",
    tags: ["yoga", "fitness", "mat"],
    description: "Premium yoga mat with superior grip and cushioning. Made from sustainable materials.",
    seller: {
      name: "Fit Life",
      username: "fitlife",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    colors: [
      { name: "Black", hex: "#000000" },
      { name: "Sage", hex: "#9CAF88" },
      { name: "Pink", hex: "#FFB6C1" },
    ],
  },
  {
    id: 11,
    name: "Smart Watch Series 5",
    brand: "Apple",
    price: 399,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&h=800&fit=crop",
    ],
    rating: 4.8,
    reviews: 4532,
    category: "electronics",
    tags: ["smartwatch", "fitness", "tech"],
    description: "The ultimate smartwatch with health monitoring, GPS, and always-on display.",
    seller: {
      name: "Tech Guru",
      username: "techguru",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    sizes: ["40mm", "44mm"],
    colors: [
      { name: "Space Gray", hex: "#3A3A3C" },
      { name: "Silver", hex: "#C0C0C0" },
      { name: "Gold", hex: "#FFD700" },
    ],
  },
  {
    id: 12,
    name: "Linen Shirt",
    brand: "Everlane",
    price: 78,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&h=800&fit=crop",
    ],
    rating: 4.6,
    reviews: 432,
    category: "fashion",
    tags: ["shirt", "linen", "casual"],
    description: "Relaxed-fit linen shirt perfect for warm weather. Ethically made with 100% European linen.",
    seller: {
      name: "Fashion Mike",
      username: "fashionmike",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
      verified: true,
    },
    inStock: true,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Blue", hex: "#87CEEB" },
      { name: "Sage", hex: "#9CAF88" },
    ],
  },
]
