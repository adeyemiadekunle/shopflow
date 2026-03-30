"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { 
  Heart, 
  ShoppingBag, 
  Star, 
  Share2, 
  Truck, 
  RotateCcw, 
  Shield,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Check,
  BadgeCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { products } from "@/lib/products-data"
import { useCart } from "@/lib/cart-context"

const reviews = [
  {
    id: 1,
    user: { name: "Emma Watson", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop" },
    rating: 5,
    date: "2 weeks ago",
    content: "Absolutely love this! The quality is amazing and it arrived faster than expected. Highly recommend!",
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop"],
  },
  {
    id: 2,
    user: { name: "James Chen", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop" },
    rating: 4,
    date: "1 month ago",
    content: "Great product, exactly as described. Shipping was quick and packaging was excellent.",
    images: [],
  },
  {
    id: 3,
    user: { name: "Sofia Martinez", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop" },
    rating: 5,
    date: "1 month ago",
    content: "This exceeded my expectations! Perfect for everyday use and looks even better in person.",
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=200&h=200&fit=crop"],
  },
]

export default function ProductPage() {
  const params = useParams()
  const productId = parseInt(params.id as string)
  const product = products.find((p) => p.id === productId)

  const { addItem } = useCart()
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  const handleAddToCart = () => {
    const colorName = product.colors?.[selectedColor]?.name
    addItem(product, quantity, colorName, selectedSize || undefined)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link href="/shop">
            <Button className="mt-4">Back to Shop</Button>
          </Link>
        </div>
      </div>
    )
  }

  const allImages = product.images || [product.image]
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 md:pb-8">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-foreground transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-foreground capitalize">{product.category}</span>
          </nav>
        </div>

        {/* Product Detail */}
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
                <Image
                  src={allImages[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImage((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}

                {/* Sale Badge */}
                {product.originalPrice && (
                  <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </Badge>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-20 w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                        selectedImage === index ? "border-accent" : "border-transparent"
                      }`}
                    >
                      <Image src={image} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Brand & Title */}
              <div>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">{product.brand}</p>
                <h1 className="text-2xl md:text-3xl font-bold mt-1 text-balance">{product.name}</h1>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating)
                          ? "fill-accent text-accent"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                )}
              </div>

              {/* Seller */}
              <Link href={`/seller/${product.seller.username}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={product.seller.avatar} />
                    <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{product.seller.name}</span>
                      {product.seller.verified && (
                        <BadgeCheck className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Sold by this seller</p>
                  </div>
                  <Button variant="secondary" size="sm">Follow</Button>
                </div>
              </Link>

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Color: {product.colors[selectedColor].name}</h3>
                  <div className="flex gap-2">
                    {product.colors.map((color, index) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(index)}
                        className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedColor === index ? "border-accent scale-110" : "border-border"
                        }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {selectedColor === index && (
                          <Check className={`h-4 w-4 ${color.hex === "#FFFFFF" || color.hex === "#FFD700" ? "text-foreground" : "text-white"}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium">Size</h3>
                    <button className="text-xs text-accent hover:underline">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-10 min-w-[2.5rem] px-3 rounded-lg border text-sm font-medium transition-colors ${
                          selectedSize === size
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-accent"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="text-sm font-medium mb-3">Quantity</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {product.inStock ? (
                    <span className="text-sm text-green-500">In Stock</span>
                  ) : (
                    <span className="text-sm text-destructive">Out of Stock</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button 
                  size="lg" 
                  className="flex-1 gap-2"
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                >
                  {addedToCart ? (
                    <>
                      <Check className="h-5 w-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">Free Shipping</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <RotateCcw className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">30-Day Returns</span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Reviews Tabs */}
          <div className="mt-12">
            <Tabs defaultValue="description">
              <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 gap-8">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent pb-3"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent pb-3"
                >
                  Reviews ({product.reviews})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="pt-6">
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {product.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="pt-6">
                <div className="space-y-6 max-w-2xl">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-border pb-6 last:border-0">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.user.avatar} />
                          <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{review.user.name}</span>
                            <span className="text-xs text-muted-foreground">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating
                                    ? "fill-accent text-accent"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{review.content}</p>
                          {review.images.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.images.map((image, i) => (
                                <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden">
                                  <Image src={image} alt="" fill className="object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-xl font-bold mb-6">You might also like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <Link key={relatedProduct.id} href={`/product/${relatedProduct.id}`}>
                    <div className="group bg-card rounded-xl overflow-hidden border border-border hover:border-accent/50 transition-all">
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                          src={relatedProduct.image}
                          alt={relatedProduct.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-muted-foreground">{relatedProduct.brand}</p>
                        <h3 className="text-sm font-medium mt-0.5 truncate">{relatedProduct.name}</h3>
                        <p className="text-sm font-semibold mt-1">${relatedProduct.price}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}
