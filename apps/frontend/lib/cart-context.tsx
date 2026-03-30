"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { type Product } from "./products-data"

export type CartItem = {
  product: Product
  quantity: number
  selectedColor?: string
  selectedSize?: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, color?: string, size?: string) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((product: Product, quantity = 1, color?: string, size?: string) => {
    setItems((prev) => {
      const existingItem = prev.find(
        (item) => 
          item.product.id === product.id &&
          item.selectedColor === color &&
          item.selectedSize === size
      )

      if (existingItem) {
        return prev.map((item) =>
          item.product.id === product.id &&
          item.selectedColor === color &&
          item.selectedSize === size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }

      return [...prev, { product, quantity, selectedColor: color, selectedSize: size }]
    })
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
