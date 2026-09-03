import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Ensure data directory exists
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, "paddle.db");
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma("journal_mode = WAL");

// Initialize tables based on user-provided schema
db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    customer_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

  CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(customer_id),
    status TEXT NOT NULL,
    price_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    scheduled_change_action TEXT,
    scheduled_change_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON subscriptions(customer_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

  CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY,
    customer_id TEXT,
    status TEXT NOT NULL,
    amount TEXT,
    currency_code TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface CustomerRecord {
  customer_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRecord {
  subscription_id: string;
  customer_id: string;
  status: string;
  price_id: string;
  product_id: string;
  scheduled_change_action: string | null;
  scheduled_change_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionRecord {
  transaction_id: string;
  customer_id: string | null;
  status: string;
  amount: string | null;
  currency_code: string | null;
  created_at: string;
}

// Customers
export function upsertCustomer(customerId: string, email: string): CustomerRecord {
  const stmt = db.prepare(`
    INSERT INTO customers (customer_id, email, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(customer_id) DO UPDATE SET
      email = excluded.email,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(customerId, email);
  return getCustomerById(customerId)!;
}

export function getCustomerById(customerId: string): CustomerRecord | undefined {
  const stmt = db.prepare("SELECT * FROM customers WHERE customer_id = ?");
  return stmt.get(customerId) as CustomerRecord | undefined;
}

export function getCustomerByEmail(email: string): CustomerRecord | undefined {
  const stmt = db.prepare("SELECT * FROM customers WHERE email = ? COLLATE NOCASE ORDER BY updated_at DESC LIMIT 1");
  return stmt.get(email) as CustomerRecord | undefined;
}

export function getAllCustomers(): CustomerRecord[] {
  const stmt = db.prepare("SELECT * FROM customers ORDER BY created_at DESC");
  return stmt.all() as CustomerRecord[];
}

// Subscriptions
export function upsertSubscription(sub: {
  subscription_id: string;
  customer_id: string;
  status: string;
  price_id: string;
  product_id: string;
  scheduled_change_action?: string | null;
  scheduled_change_at?: string | null;
}): SubscriptionRecord {
  const stmt = db.prepare(`
    INSERT INTO subscriptions (
      subscription_id,
      customer_id,
      status,
      price_id,
      product_id,
      scheduled_change_action,
      scheduled_change_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(subscription_id) DO UPDATE SET
      customer_id = excluded.customer_id,
      status = excluded.status,
      price_id = excluded.price_id,
      product_id = excluded.product_id,
      scheduled_change_action = excluded.scheduled_change_action,
      scheduled_change_at = excluded.scheduled_change_at,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(
    sub.subscription_id,
    sub.customer_id,
    sub.status,
    sub.price_id,
    sub.product_id,
    sub.scheduled_change_action ?? null,
    sub.scheduled_change_at ?? null
  );
  return getSubscriptionById(sub.subscription_id)!;
}

export function getSubscriptionById(subscriptionId: string): SubscriptionRecord | undefined {
  const stmt = db.prepare("SELECT * FROM subscriptions WHERE subscription_id = ?");
  return stmt.get(subscriptionId) as SubscriptionRecord | undefined;
}

export function getSubscriptionByCustomerId(customerId: string): SubscriptionRecord | undefined {
  const stmt = db.prepare(`
    SELECT * FROM subscriptions
    WHERE customer_id = ?
    ORDER BY
      CASE status
        WHEN 'active' THEN 0
        WHEN 'trialing' THEN 1
        WHEN 'past_due' THEN 2
        WHEN 'paused' THEN 3
        WHEN 'canceled' THEN 4
        ELSE 5
      END,
      updated_at DESC
    LIMIT 1
  `);
  return stmt.get(customerId) as SubscriptionRecord | undefined;
}

export function getAllSubscriptions(): SubscriptionRecord[] {
  const stmt = db.prepare("SELECT * FROM subscriptions ORDER BY updated_at DESC");
  return stmt.all() as SubscriptionRecord[];
}

// Transactions
export function upsertTransaction(tx: {
  transaction_id: string;
  customer_id?: string | null;
  status: string;
  amount?: string | null;
  currency_code?: string | null;
}): void {
  const stmt = db.prepare(`
    INSERT INTO transactions (transaction_id, customer_id, status, amount, currency_code)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(transaction_id) DO UPDATE SET
      status = excluded.status,
      amount = excluded.amount,
      currency_code = excluded.currency_code
  `);
  stmt.run(tx.transaction_id, tx.customer_id ?? null, tx.status, tx.amount ?? null, tx.currency_code ?? null);
}

export function getAllTransactions(): TransactionRecord[] {
  const stmt = db.prepare("SELECT * FROM transactions ORDER BY created_at DESC");
  return stmt.all() as TransactionRecord[];
}

export default db;
