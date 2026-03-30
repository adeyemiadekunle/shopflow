"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { User, Seller } from "./types"

interface AuthState {
  user: User | Seller | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType extends AuthState {
  login: (phone: string) => Promise<{ success: boolean; message: string }>
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; user?: User | Seller; isNewUser?: boolean }>
  register: (data: RegisterData) => Promise<{ success: boolean; user?: User }>
  registerSeller: (data: SellerRegisterData) => Promise<{ success: boolean; seller?: Seller }>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

interface RegisterData {
  phone: string
  displayName: string
  email?: string
}

interface SellerRegisterData extends RegisterData {
  storeName: string
  storeDescription?: string
  businessAddress: {
    street: string
    city: string
    state: string
    lga: string
  }
  idType: "nin" | "drivers_license" | "voters_card" | "passport"
  idNumber: string
  bankName: string
  bankCode: string
  accountNumber: string
  accountName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user data for demo
const MOCK_USERS: Record<string, User | Seller> = {
  "08012345678": {
    id: "user_1",
    phone: "08012345678",
    email: "john@example.com",
    displayName: "John Doe",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    role: "buyer",
    isVerified: true,
    createdAt: new Date("2024-01-15"),
  },
  "08087654321": {
    id: "seller_1",
    phone: "08087654321",
    email: "sarah@fashionhub.ng",
    displayName: "Sarah Styles",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    role: "seller",
    isVerified: true,
    createdAt: new Date("2023-06-10"),
    storeName: "Fashion Hub NG",
    storeSlug: "fashionhub-ng",
    storeDescription: "Your one-stop shop for trendy fashion items",
    storeLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
    storeBanner: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&h=400&fit=crop",
    businessAddress: {
      id: "addr_1",
      label: "Store",
      fullName: "Sarah Styles",
      phone: "08087654321",
      street: "25 Fashion Street, Lekki",
      city: "Lagos",
      state: "Lagos",
      lga: "Lekki",
      isDefault: true,
    },
    bankDetails: {
      bankName: "GTBank",
      bankCode: "058",
      accountNumber: "0123456789",
      accountName: "Sarah Styles",
    },
    kycStatus: "verified",
    kycDocuments: {
      idType: "nin",
      idNumber: "12345678901",
    },
    rating: 4.8,
    totalSales: 2450000,
    totalOrders: 156,
    joinedAt: new Date("2023-06-10"),
  } as Seller,
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: false,
    isAuthenticated: false,
  })

  const login = useCallback(async (phone: string): Promise<{ success: boolean; message: string }> => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setState(prev => ({ ...prev, isLoading: false }))
    
    // Always succeed for demo - OTP will be "123456"
    return { success: true, message: "OTP sent successfully" }
  }, [])

  const verifyOtp = useCallback(async (phone: string, otp: string): Promise<{ success: boolean; user?: User | Seller; isNewUser?: boolean }> => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Demo OTP is always "123456"
    if (otp !== "123456") {
      setState(prev => ({ ...prev, isLoading: false }))
      return { success: false }
    }
    
    // Check if user exists
    const existingUser = MOCK_USERS[phone]
    
    if (existingUser) {
      setState({
        user: existingUser,
        isLoading: false,
        isAuthenticated: true,
      })
      return { success: true, user: existingUser, isNewUser: false }
    }
    
    // New user - needs registration
    setState(prev => ({ ...prev, isLoading: false }))
    return { success: true, isNewUser: true }
  }, [])

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; user?: User }> => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      phone: data.phone,
      email: data.email,
      displayName: data.displayName,
      role: "buyer",
      isVerified: false,
      createdAt: new Date(),
    }
    
    setState({
      user: newUser,
      isLoading: false,
      isAuthenticated: true,
    })
    
    return { success: true, user: newUser }
  }, [])

  const registerSeller = useCallback(async (data: SellerRegisterData): Promise<{ success: boolean; seller?: Seller }> => {
    setState(prev => ({ ...prev, isLoading: true }))
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newSeller: Seller = {
      id: `seller_${Date.now()}`,
      phone: data.phone,
      email: data.email,
      displayName: data.displayName,
      role: "seller",
      isVerified: false,
      createdAt: new Date(),
      storeName: data.storeName,
      storeSlug: data.storeName.toLowerCase().replace(/\s+/g, "-"),
      storeDescription: data.storeDescription,
      businessAddress: {
        id: `addr_${Date.now()}`,
        label: "Business",
        fullName: data.displayName,
        phone: data.phone,
        street: data.businessAddress.street,
        city: data.businessAddress.city,
        state: data.businessAddress.state,
        lga: data.businessAddress.lga,
        isDefault: true,
      },
      bankDetails: {
        bankName: data.bankName,
        bankCode: data.bankCode,
        accountNumber: data.accountNumber,
        accountName: data.accountName,
      },
      kycStatus: "submitted",
      kycDocuments: {
        idType: data.idType,
        idNumber: data.idNumber,
      },
      rating: 0,
      totalSales: 0,
      totalOrders: 0,
      joinedAt: new Date(),
    }
    
    setState({
      user: newSeller,
      isLoading: false,
      isAuthenticated: true,
    })
    
    return { success: true, seller: newSeller }
  }, [])

  const logout = useCallback(() => {
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }, [])

  const updateUser = useCallback((data: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...data } : null,
    }))
  }, [])

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      verifyOtp,
      register,
      registerSeller,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
