"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { 
  BadgeCheck, 
  Grid3X3, 
  ShoppingBag, 
  Heart,
  Star,
  Users,
  Link as LinkIcon,
  Share2,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { FollowButton } from "@/components/follow-button"
import { products } from "@/lib/products-data"

// Mock seller data - in a real app this would come from a database
const sellersData: Record<string, {
  name: string
  username: string
  avatar: string
  cover: string
  verified: boolean
  bio: string
  website: string
  followers: number
  following: number
  totalSales: number
}> = {
  alexstyle: {
    name: "Alex Style",
    username: "alexstyle",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=400&fit=crop",
    verified: true,
    bio: "Fashion & lifestyle curator. Sharing my favorite finds and everyday essentials. Collab inquiries: hello@alexstyle.com",
    website: "alexstyle.com",
    followers: 245000,
    following: 892,
    totalSales: 12500,
  },
  techguru: {
    name: "Tech Guru",
    username: "techguru",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&h=400&fit=crop",
    verified: true,
    bio: "Your go-to source for honest tech reviews. Testing the latest gadgets so you don't have to. New videos every week!",
    website: "techguru.io",
    followers: 1200000,
    following: 234,
    totalSales: 89000,
  },
  fashionmike: {
    name: "Fashion Mike",
    username: "fashionmike",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&h=400&fit=crop",
    verified: true,
    bio: "Men's fashion enthusiast. Sustainable style advocate. Making fashion accessible for everyone.",
    website: "fashionmike.co",
    followers: 567000,
    following: 445,
    totalSales: 34000,
  },
  homevibes: {
    name: "Home Vibes",
    username: "homevibes",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&h=400&fit=crop",
    verified: false,
    bio: "Interior design lover. Creating cozy spaces on any budget. DIY tips & home decor inspiration.",
    website: "homevibes.design",
    followers: 89000,
    following: 1200,
    totalSales: 5600,
  },
  sarahstyle: {
    name: "Sarah Mitchell",
    username: "sarahstyle",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    cover: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&h=400&fit=crop",
    verified: true,
    bio: "Fashion blogger & content creator. Sharing my daily outfits and styling tips. Let's make fashion fun!",
    website: "sarahmitchell.style",
    followers: 890000,
    following: 567,
    totalSales: 67000,
  },
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export default function SellerPage() {
  const params = useParams()
  const username = params.username as string
  const seller = sellersData[username]
  const [likedProducts, setLikedProducts] = useState<number[]>([])

  const sellerProducts = products.filter(
    (p) => p.seller.username.toLowerCase() === username.toLowerCase()
  )

  const toggleLike = (productId: number) => {
    setLikedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-16 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 text-center">
            <h1 className="text-2xl font-bold">Seller not found</h1>
            <p className="text-muted-foreground mt-2">
              The seller you&apos;re looking for doesn&apos;t exist.
            </p>
            <Link href="/">
              <Button className="mt-4">Back to Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 md:pb-8">
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 bg-secondary">
          <Image
            src={seller.cover}
            alt={`${seller.name} cover`}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="relative -mt-16 md:-mt-20">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* Avatar */}
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background">
                <AvatarImage src={seller.avatar} />
                <AvatarFallback className="text-3xl">{seller.name[0]}</AvatarFallback>
              </Avatar>

              {/* Info & Actions */}
              <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{seller.name}</h1>
                    {seller.verified && (
                      <BadgeCheck className="h-6 w-6 text-accent" />
                    )}
                  </div>
                  <p className="text-muted-foreground">@{seller.username}</p>
                </div>

                <div className="flex items-center gap-3">
                    <FollowButton className="min-w-[100px]" size="pill-sm" />
                    <Button variant="outline" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Bio */}
            <p className="mt-4 text-sm text-muted-foreground max-w-xl text-pretty">
              {seller.bio}
            </p>

            {/* Website */}
            <a
              href={`https://${seller.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 mt-2 text-sm text-accent hover:underline"
            >
              <LinkIcon className="h-4 w-4" />
              {seller.website}
            </a>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6 py-4 border-y border-border">
              <div className="text-center">
                <p className="text-xl font-bold">{formatNumber(seller.followers)}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{formatNumber(seller.following)}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{sellerProducts.length}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{formatNumber(seller.totalSales)}</p>
                <p className="text-xs text-muted-foreground">Sales</p>
              </div>
            </div>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="products" className="mt-6">
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 gap-8">
              <TabsTrigger
                value="products"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent pb-3 gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent pb-3 gap-2"
              >
                <Grid3X3 className="h-4 w-4" />
                Posts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="pt-6">
              {sellerProducts.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No products yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sellerProducts.map((product) => (
                    <Link key={product.id} href={`/product/${product.id}`}>
                      <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-accent/50 transition-all">
                        <div className="relative aspect-square overflow-hidden">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              toggleLike(product.id)
                            }}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                likedProducts.includes(product.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-foreground"
                              }`}
                            />
                          </button>
                          {product.originalPrice && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                              Sale
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                          <h3 className="text-sm font-medium mt-0.5 truncate">{product.name}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 fill-accent text-accent" />
                            <span className="text-xs">{product.rating}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-semibold">${product.price}</span>
                            {product.originalPrice && (
                              <span className="text-xs text-muted-foreground line-through">
                                ${product.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="posts" className="pt-6">
              <div className="grid grid-cols-3 gap-1 md:gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="relative aspect-square bg-secondary rounded-sm md:rounded-lg overflow-hidden group cursor-pointer">
                    <Image
                      src={`https://images.unsplash.com/photo-${1483985988355 + i * 1000}-763728e1935b?w=400&h=400&fit=crop`}
                      alt=""
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Heart className="h-4 w-4 fill-current" />
                        {Math.floor(Math.random() * 10000)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
