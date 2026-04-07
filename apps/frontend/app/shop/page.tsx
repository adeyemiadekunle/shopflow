"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  Grid3X3, 
  Shirt, 
  Smartphone, 
  Home, 
  Sparkles, 
  Dumbbell, 
  Watch,
  SlidersHorizontal,
  Heart,
  Star,
  ChevronDown,
  X,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"
import { Footer } from "@/components/footer"
import { AddToCartButton } from "@/components/add-to-cart-button"
import { products, categories, type Product } from "@/lib/products-data"

const categoryIcons: Record<string, React.ElementType> = {
  Grid3X3,
  Shirt,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
  Watch,
}

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
]

const brands = [...new Set(products.map(p => p.brand))]

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popular")
  const [priceRange, setPriceRange] = useState([0, 500])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [likedProducts, setLikedProducts] = useState<number[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleLike = (productId: number) => {
    setLikedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand)
        ? prev.filter((b) => b !== brand)
        : [...prev, brand]
    )
  }

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      // Category filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false
      }
      // Price filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) {
        return false
      }
      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false
      }
      return true
    })

    // Sort
    switch (sortBy) {
      case "newest":
        filtered = filtered.reverse()
        break
      case "price-low":
        filtered = filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered = filtered.sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered = filtered.sort((a, b) => b.rating - a.rating)
        break
      default:
        filtered = filtered.sort((a, b) => b.reviews - a.reviews)
    }

    return filtered
  }, [selectedCategory, sortBy, priceRange, selectedBrands])

  const clearFilters = () => {
    setSelectedCategory("all")
    setPriceRange([0, 500])
    setSelectedBrands([])
  }

  const activeFiltersCount = 
    (selectedCategory !== "all" ? 1 : 0) + 
    (selectedBrands.length > 0 ? 1 : 0) + 
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16 pb-20 md:pb-8">
        {/* Hero Banner */}
        <div className="relative h-48 md:h-64 bg-secondary overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=400&fit=crop"
            alt="Shop Banner"
            fill
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-balance">Shop the Feed</h1>
            <p className="text-muted-foreground mt-2 max-w-md text-pretty">
              Discover products curated by your favorite creators
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex gap-2 py-4 overflow-x-auto scrollbar-hide">
              {categories.map((category) => {
                const Icon = categoryIcons[category.icon]
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="border-b border-border bg-background sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                {/* Mobile Filters */}
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="md:hidden gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge className="h-5 w-5 p-0 flex items-center justify-center">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* Price Range */}
                      <div>
                        <h3 className="text-sm font-medium mb-4">Price Range</h3>
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={500}
                          step={10}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>${priceRange[0]}</span>
                          <span>${priceRange[1]}</span>
                        </div>
                      </div>

                      {/* Brands */}
                      <div>
                        <h3 className="text-sm font-medium mb-4">Brands</h3>
                        <div className="space-y-3">
                          {brands.map((brand) => (
                            <label key={brand} className="flex items-center gap-3 cursor-pointer">
                              <Checkbox
                                checked={selectedBrands.includes(brand)}
                                onCheckedChange={() => toggleBrand(brand)}
                              />
                              <span className="text-sm">{brand}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <Button onClick={clearFilters} variant="outline" className="w-full">
                        Clear All Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Desktop Filters */}
                <div className="hidden md:flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        Price
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 p-4">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={500}
                        step={10}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        Brand
                        {selectedBrands.length > 0 && (
                          <Badge className="h-5 w-5 p-0 flex items-center justify-center">
                            {selectedBrands.length}
                          </Badge>
                        )}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      {brands.map((brand) => (
                        <DropdownMenuItem
                          key={brand}
                          onClick={() => toggleBrand(brand)}
                          className="gap-2"
                        >
                          {selectedBrands.includes(brand) && <Check className="h-4 w-4" />}
                          <span className={selectedBrands.includes(brand) ? "" : "ml-6"}>
                            {brand}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-muted-foreground"
                    >
                      Clear all
                      <X className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>

                <span className="text-sm text-muted-foreground">
                  {filteredProducts.length} products
                </span>
              </div>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {sortOptions.find(o => o.value === sortBy)?.label}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className="gap-2"
                    >
                      {sortBy === option.value && <Check className="h-4 w-4" />}
                      <span className={sortBy === option.value ? "" : "ml-6"}>
                        {option.label}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No products found matching your filters.</p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLiked={likedProducts.includes(product.id)}
                  onToggleLike={() => toggleLike(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  )
}

function ProductCard({
  product,
  isLiked,
  onToggleLike,
}: {
  product: Product
  isLiked: boolean
  onToggleLike: () => void
}) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-accent/50 transition-all cursor-pointer">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Like Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              onToggleLike()
            }}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart
              className={`h-4 w-4 ${
                isLiked ? "fill-red-500 text-red-500" : "text-foreground"
              }`}
            />
          </button>

          {/* Sale Badge */}
          {product.originalPrice && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              Sale
            </div>
          )}

          {/* Quick Add */}
          <AddToCartButton
            productId={product.id}
            className="absolute right-2 bottom-2 left-2 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
          />
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <h3 className="text-sm font-medium mt-0.5 truncate">{product.name}</h3>
          
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-xs font-medium">{product.rating}</span>
            <span className="text-xs text-muted-foreground">({product.reviews})</span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-semibold">${product.price}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>

          <p className="text-xs text-accent mt-1.5 truncate">
            by @{product.seller.username}
          </p>
        </div>
      </div>
    </Link>
  )
}
