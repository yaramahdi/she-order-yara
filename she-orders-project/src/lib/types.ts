export type OrderSummary = {
  id: string;
  email_name: string;
  created_date: string;
  order_cost_with_coordination: number;
  nader_paid_ils: number;
  nader_paid_usd: number;
  is_finished: boolean;
  created_at: string;
  updated_at: string;
  girls_count: number;
  girls_total_price: number;
  total_deposit: number;
  total_remaining: number;
  profit: number;
};

export type OrderItem = {
  id: string;
  order_id: string;
  name: string;
  instagram_url: string;
  total_price: number;
  deposit_paid: number;
  remaining_price: number;
  payment_proof_path: string | null;
  payment_proof_paths: string[];
  payment_proof_url?: string | null;
  payment_proof_urls?: string[];
  order_image_paths: string[];
  order_image_urls?: string[];
  created_at: string;
  updated_at: string;
};