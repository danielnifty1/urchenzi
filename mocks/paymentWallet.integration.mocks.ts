import type { InitializePaymentResponse, PaymentCallbackVerification, PaymentOrderStatus } from "@/services/paymentApi";
import type { WalletBalance, WalletTransactionsPage } from "@/services/walletApi";

export const mockInitializePaymentSuccess: InitializePaymentResponse = {
  authorizationUrl: "https://checkout.paystack.com/mock",
  reference: "pay_mock_123",
};

export const mockInitializePaymentFailure = {
  status: 409,
  message: "Order already paid",
};

export const mockCallbackPending: PaymentCallbackVerification = {
  orderId: "order_1",
  isPaid: false,
  paymentStatus: "pending",
  paymentReference: "pay_mock_123",
  gatewayStatus: "pending",
  message: "Awaiting webhook confirmation",
};

export const mockCallbackPaid: PaymentCallbackVerification = {
  orderId: "order_1",
  isPaid: true,
  paymentStatus: "paid",
  paymentReference: "pay_mock_123",
  gatewayStatus: "success",
};

export const mockPollingSequence: PaymentOrderStatus[] = [
  { orderId: "order_1", isPaid: false, paymentStatus: "pending" },
  { orderId: "order_1", isPaid: false, paymentStatus: "pending" },
  { orderId: "order_1", isPaid: true, paymentStatus: "paid" },
];

export const mockWalletBalance: WalletBalance = {
  balance: 1234.5,
  totalCredits: 2000,
  totalDebits: 765.5,
};

export const mockWalletTransactions: WalletTransactionsPage = {
  items: [
    {
      id: "tx_1",
      type: "credit",
      status: "success",
      amount: 1000,
      reference: "ref_1",
      createdAt: "2026-01-01T10:00:00.000Z",
    },
    {
      id: "tx_2",
      type: "debit",
      status: "success",
      amount: 250,
      reference: "ref_2",
      createdAt: "2026-01-02T10:00:00.000Z",
    },
  ],
  meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
};
