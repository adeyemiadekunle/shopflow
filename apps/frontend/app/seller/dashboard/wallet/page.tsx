"use client"

import { useState } from "react"
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle,
  CreditCard,
  Shield,
  TrendingUp,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNaira } from "@/lib/types"

// Mock wallet data
const walletData = {
  availableBalance: 185000,
  pendingBalance: 125000,
  totalEarnings: 2450000,
  totalWithdrawn: 2140000,
}

const transactions = [
  {
    id: "txn_1",
    type: "credit",
    description: "Order #ORD-2024-001 completed",
    amount: 21000,
    status: "completed",
    date: "2024-03-15T10:30:00",
  },
  {
    id: "txn_2",
    type: "debit",
    description: "Withdrawal to GTBank ****6789",
    amount: 50000,
    status: "completed",
    date: "2024-03-14T14:00:00",
  },
  {
    id: "txn_3",
    type: "escrow_hold",
    description: "Order #ORD-2024-002 - Escrow hold",
    amount: 12000,
    status: "pending",
    date: "2024-03-14T12:30:00",
  },
  {
    id: "txn_4",
    type: "credit",
    description: "Order #ORD-2024-003 completed",
    amount: 27500,
    status: "completed",
    date: "2024-03-13T16:00:00",
  },
  {
    id: "txn_5",
    type: "escrow_release",
    description: "Order #ORD-2024-004 - Escrow released",
    amount: 15000,
    status: "completed",
    date: "2024-03-12T11:30:00",
  },
  {
    id: "txn_6",
    type: "debit",
    description: "Withdrawal to GTBank ****6789",
    amount: 100000,
    status: "completed",
    date: "2024-03-10T09:00:00",
  },
]

const typeConfig = {
  credit: { icon: ArrowDownLeft, color: "text-green-500 bg-green-500/10", prefix: "+" },
  debit: { icon: ArrowUpRight, color: "text-red-500 bg-red-500/10", prefix: "-" },
  escrow_hold: { icon: Shield, color: "text-yellow-500 bg-yellow-500/10", prefix: "" },
  escrow_release: { icon: Shield, color: "text-blue-500 bg-blue-500/10", prefix: "+" },
}

const statusConfig = {
  completed: { icon: CheckCircle, color: "text-green-500" },
  pending: { icon: Clock, color: "text-yellow-500" },
  failed: { icon: XCircle, color: "text-red-500" },
}

export default function WalletPage() {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState("")

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
        </div>
        <Button 
          className="gap-2"
          onClick={() => setShowWithdrawModal(true)}
          disabled={walletData.availableBalance < 1000}
        >
          <ArrowUpRight className="h-4 w-4" />
          Withdraw
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
          </div>
          <p className="text-2xl font-bold">{formatNaira(walletData.availableBalance)}</p>
          <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground">Pending (Escrow)</p>
          </div>
          <p className="text-2xl font-bold">{formatNaira(walletData.pendingBalance)}</p>
          <p className="text-xs text-muted-foreground mt-1">Awaiting delivery confirmation</p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-sm text-muted-foreground">Total Earnings</p>
          </div>
          <p className="text-2xl font-bold">{formatNaira(walletData.totalEarnings)}</p>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-sm text-muted-foreground">Total Withdrawn</p>
          </div>
          <p className="text-2xl font-bold">{formatNaira(walletData.totalWithdrawn)}</p>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
        </div>
      </div>

      {/* Escrow Info */}
      <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-start gap-3">
        <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">How Escrow Works</p>
          <p className="text-sm text-muted-foreground">
            Funds are held securely until the buyer confirms delivery. This protects both you and your customers. 
            Once confirmed, funds are released to your available balance within 24 hours.
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h2 className="font-semibold">Recent Transactions</h2>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="divide-y divide-border">
          {transactions.map((txn) => {
            const type = typeConfig[txn.type as keyof typeof typeConfig]
            const status = statusConfig[txn.status as keyof typeof statusConfig]
            return (
              <div key={txn.id} className="flex items-center gap-4 p-4 md:px-6">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${type.color}`}>
                  <type.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{txn.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDate(txn.date)}</span>
                    <span className="flex items-center gap-1">
                      <status.icon className={`h-3 w-3 ${status.color}`} />
                      {txn.status}
                    </span>
                  </div>
                </div>
                <p className={`font-semibold shrink-0 ${
                  txn.type === "credit" || txn.type === "escrow_release" 
                    ? "text-green-500" 
                    : txn.type === "debit" 
                      ? "text-red-500" 
                      : ""
                }`}>
                  {type.prefix}{formatNaira(txn.amount)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <>
          <div 
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowWithdrawModal(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-4">
            <div className="rounded-xl border border-border bg-card shadow-lg">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold">Withdraw Funds</h2>
                <p className="text-sm text-muted-foreground">
                  Available: {formatNaira(walletData.availableBalance)}
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <input
                      type="text"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ""))}
                      placeholder="0"
                      className="w-full h-12 pl-8 pr-4 rounded-xl bg-secondary border border-border text-foreground text-lg font-semibold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[10000, 25000, 50000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setWithdrawAmount(amount.toString())}
                        className="px-3 py-1.5 rounded-lg bg-secondary text-sm hover:bg-secondary/80 transition-colors"
                      >
                        {formatNaira(amount)}
                      </button>
                    ))}
                    <button
                      onClick={() => setWithdrawAmount(walletData.availableBalance.toString())}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-sm hover:bg-secondary/80 transition-colors"
                    >
                      Max
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-sm font-medium">Withdrawal Account</p>
                  <p className="text-sm text-muted-foreground">GTBank • ****6789 • Sarah Styles</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowWithdrawModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!withdrawAmount || parseInt(withdrawAmount) < 1000 || parseInt(withdrawAmount) > walletData.availableBalance}
                  >
                    Withdraw
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
