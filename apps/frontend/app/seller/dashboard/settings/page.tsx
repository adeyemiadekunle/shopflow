"use client"

import { useState } from "react"
import { 
  User, 
  Store, 
  CreditCard, 
  Bell, 
  Shield,
  Camera,
  Check,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NIGERIAN_STATES, NIGERIAN_BANKS } from "@/lib/types"

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "store", label: "Store", icon: Store },
  { id: "bank", label: "Bank Details", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "verification", label: "Verification", icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [isSaving, setIsSaving] = useState(false)

  // Mock seller data
  const [profile, setProfile] = useState({
    displayName: "Sarah Styles",
    email: "sarah@fashionhub.ng",
    phone: "08087654321",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  })

  const [storeData, setStoreData] = useState({
    storeName: "Fashion Hub NG",
    storeDescription: "Your one-stop shop for trendy fashion items",
    street: "25 Fashion Street, Lekki",
    city: "Lagos",
    state: "Lagos",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
  })

  const [bankData, setBankData] = useState({
    bankName: "Guaranty Trust Bank",
    bankCode: "058",
    accountNumber: "0123456789",
    accountName: "Sarah Styles",
  })

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    paymentUpdates: true,
    promotions: false,
    newsletter: false,
  })

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and store settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-card hover:bg-secondary"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-border bg-card">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Personal Information</h2>
                <p className="text-sm text-muted-foreground">Update your personal details</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatarUrl} alt={profile.displayName} />
                    <AvatarFallback>{profile.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <p className="font-medium">{profile.displayName}</p>
                  <p className="text-sm text-muted-foreground">Upload a profile photo</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    value={profile.displayName}
                    onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* Store Tab */}
          {activeTab === "store" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Store Details</h2>
                <p className="text-sm text-muted-foreground">Customize your storefront</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name</label>
                  <input
                    type="text"
                    value={storeData.storeName}
                    onChange={(e) => setStoreData({ ...storeData, storeName: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Description</label>
                  <textarea
                    value={storeData.storeDescription}
                    onChange={(e) => setStoreData({ ...storeData, storeDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Address</label>
                  <input
                    type="text"
                    value={storeData.street}
                    onChange={(e) => setStoreData({ ...storeData, street: e.target.value })}
                    placeholder="Street Address"
                    className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <input
                      type="text"
                      value={storeData.city}
                      onChange={(e) => setStoreData({ ...storeData, city: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">State</label>
                    <select
                      value={storeData.state}
                      onChange={(e) => setStoreData({ ...storeData, state: e.target.value })}
                      className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    >
                      {NIGERIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* Bank Tab */}
          {activeTab === "bank" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Bank Details</h2>
                <p className="text-sm text-muted-foreground">Manage your withdrawal account</p>
              </div>

              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Account Verified</p>
                    <p className="text-sm text-muted-foreground">Your bank account has been verified</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bank Name</label>
                  <select
                    value={bankData.bankName}
                    onChange={(e) => {
                      const bank = NIGERIAN_BANKS.find(b => b.name === e.target.value)
                      if (bank) {
                        setBankData({ ...bankData, bankName: bank.name, bankCode: bank.code })
                      }
                    }}
                    className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    {NIGERIAN_BANKS.map(bank => (
                      <option key={bank.code} value={bank.name}>{bank.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Number</label>
                  <input
                    type="text"
                    value={bankData.accountNumber}
                    onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    className="w-full h-10 px-4 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Name</label>
                  <input
                    type="text"
                    value={bankData.accountName}
                    disabled
                    className="w-full h-10 px-4 rounded-lg bg-secondary/50 border border-border text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">Auto-filled from bank verification</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">Choose what updates you receive</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: "orderUpdates", label: "Order Updates", description: "Get notified about new orders and status changes" },
                  { key: "paymentUpdates", label: "Payment Updates", description: "Receive alerts about payments and withdrawals" },
                  { key: "promotions", label: "Promotions", description: "Tips and promotions to grow your business" },
                  { key: "newsletter", label: "Newsletter", description: "Weekly digest of platform updates" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ 
                        ...notifications, 
                        [item.key]: !notifications[item.key as keyof typeof notifications] 
                      })}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications] ? "bg-accent" : "bg-border"
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications[item.key as keyof typeof notifications] ? "translate-x-7" : "translate-x-1"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* Verification Tab */}
          {activeTab === "verification" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Verification Status</h2>
                <p className="text-sm text-muted-foreground">Your account verification details</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-500">Identity Verified</p>
                    <p className="text-sm text-muted-foreground">NIN: ****8901</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-500">Bank Account Verified</p>
                    <p className="text-sm text-muted-foreground">GTBank ****6789</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-500">Phone Verified</p>
                    <p className="text-sm text-muted-foreground">+234 808 765 4321</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/50">
                <p className="text-sm">
                  <strong>Need help?</strong> Contact our support team if you have any issues with verification.
                </p>
                <Button variant="link" className="p-0 h-auto mt-2 gap-1">
                  Contact Support <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
