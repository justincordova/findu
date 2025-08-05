export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
