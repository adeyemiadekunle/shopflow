"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Package,
  Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNaira } from "@/lib/types"

// Mock products data
const mockProducts = [
  {
    id: "prod_1",
    name: "Ankara Print Dress",
    image: "https://images.unsplash.com/photo-1590400516695-36e82e20f5f5?w=200&h=200&fit=crop",
    price: 15000,
    compareAtPrice: 18000,
    stock: 25,
    status: "active",
    category: "Fashion",
    sales: 45,
  },
  {
    id: "prod_2",
    name: "Leather Crossbody Bag",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop",
    price: 12000,
    stock: 18,
    status: "active",
    category: "Accessories",
    sales: 38,
  },
  {
    id: "prod_3",
    name: "Beaded Necklace Set",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=200&h=200&fit=crop",
    price: 6000,
    stock: 0,
    status: "out_of_stock",
    category: "Jewelry",
    sales: 32,
  },
  {
    id: "prod_4",
    name: "Handwoven Basket Bag",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=200&h=200&fit=crop",
    price: 8500,
    stock: 12,
    status: "draft",
    category: "Accessories",
    sales: 0,
  },
  {
    id: "prod_5",
    name: "African Print Headwrap",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&h=200&fit=crop",
    price: 3500,
    stock: 50,
    status: "active",
    category: "Accessories",
    sales: 28,
  },
]

const statusConfig = {
  active: { label: "Active", color: "text-green-500 bg-green-500/10" },
  draft: { label: "Draft", color: "text-yellow-500 bg-yellow-500/10" },
  out_of_stock: { label: "Out of Stock", color: "text-red-500 bg-red-500/10" },
}

export default function ProductsPage() {
  const [products, setProducts] = useState(mockProducts)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === "all" || product.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const toggleProductStatus = (productId: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        return { ...p, status: p.status === "active" ? "draft" : "active" }
      }
      return p
    }))
    setOpenMenu(null)
  }

  const deleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(prev => prev.filter(p => p.id !== productId))
    }
    setOpenMenu(null)
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">{products.length} total products</p>
        </div>
        <Link href="/seller/dashboard/products/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Stock</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Sales</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((product) => {
                  const status = statusConfig[product.status as keyof typeof statusConfig]
                  return (
                    <tr key={product.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{formatNaira(product.price)}</p>
                        {product.compareAtPrice && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatNaira(product.compareAtPrice)}
                          </p>
                        )}
                      </td>
                      <td className="p-4">
                        <p className={product.stock === 0 ? "text-red-500" : ""}>
                          {product.stock} units
                        </p>
                      </td>
                      <td className="p-4">
                        <p>{product.sales} sold</p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openMenu === product.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMenu(null)}
                              />
                              <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-border bg-card shadow-lg">
                                <div className="p-2">
                                  <Link
                                    href={`/seller/dashboard/products/${product.id}`}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit Product
                                  </Link>
                                  <button
                                    onClick={() => toggleProductStatus(product.id)}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors"
                                  >
                                    {product.status === "active" ? (
                                      <>
                                        <EyeOff className="h-4 w-4" />
                                        Hide Product
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4" />
                                        Publish Product
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => deleteProduct(product.id)}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Product
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden divide-y divide-border">
            {filteredProducts.map((product) => {
              const status = statusConfig[product.status as keyof typeof statusConfig]
              return (
                <div key={product.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium shrink-0 ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <p className="font-semibold">{formatNaira(product.price)}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.stock} in stock • {product.sales} sold
                          </p>
                        </div>
                        <Link href={`/seller/dashboard/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-border bg-card">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No products found</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            {searchQuery || filterStatus !== "all" 
              ? "Try adjusting your search or filters"
              : "Get started by adding your first product"
            }
          </p>
          {!searchQuery && filterStatus === "all" && (
            <Link href="/seller/dashboard/products/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
