export type VideoStatus = 'draft' | 'published' | 'archived';
export type ProgramStatus = 'draft' | 'published';
export type VideoType = 'signature' | 'complementary' | 'mobility';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'none';
export type SubscriptionRecordStatus = 'active' | 'cancelled' | 'expired' | 'grace_period';

export type Method = {
  id: string;
  title: string;
  subtitle: string | null;
  goal: string;
  description: string | null;
  cover_image_url: string | null;
  tagline: string | null;
  status: ProgramStatus;
  published_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Program = {
  id: string;
  method_id: string;
  title: string;
  description: string | null;
  duration_weeks: number;
  signature_session_id: string | null;
  signature_session_ids: string[];
  complementary_session_ids: string[];
  mobility_session_ids?: string[];
  session_section_order?: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Video = {
  id: string;
  program_id: string | null;
  title: string;
  description: string | null;
  duration_seconds: number;
  thumbnail_url: string | null;
  vimeo_video_id: string;
  vimeo_hash: string | null;
  type: VideoType;
  week_number: number;
  order_in_week: number;
  status: VideoStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Exercise = {
  id: string;
  name: string;
  description: string | null;
  muscle_groups: string | null;
  vimeo_video_id: string | null;
  vimeo_hash: string | null;
  created_at: string;
  updated_at: string;
};

export type VideoExercise = {
  id: string;
  video_id: string;
  library_exercise_id: string | null;
  name: string;
  muscle_groups: string | null;
  target_sets: number;
  target_reps: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ExerciseDraft = {
  id?: string;
  library_exercise_id: string;
  name: string;
  muscle_groups: string;
  target_sets: number;
  target_reps: number;
  sort_order: number;
};

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  subscription_plan: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_program_id: string | null;
  onboarding_completed: boolean;
  premium_prompt_count: number;
  last_premium_prompt_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  product_id: string;
  platform: 'ios' | 'android' | 'web' | null;
  status: SubscriptionRecordStatus;
  price_monthly: number;
  currency: string;
  revenuecat_customer_id: string | null;
  store_transaction_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  started_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

export type CommunityPostAuthor = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

export type CommunityCommentAdmin = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  author: CommunityPostAuthor;
};

export type CommunityPostAdmin = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  program_title: string | null;
  session_title: string | null;
  created_at: string;
  likes: number;
  comments_count: number;
  author: CommunityPostAuthor;
  comments: CommunityCommentAdmin[];
};

export type CommunityStats = {
  totalPosts: number;
  postsThisWeek: number;
  totalComments: number;
};

export type DashboardStats = {
  users: number;
  activeSubscriptions: number;
  programs: number;
  publishedVideos: number;
  sessionsThisMonth: number;
  communityPosts: number;
};

export type RecentSubscriptionRow = {
  id: string;
  user_id: string;
  userName: string;
  userEmail: string;
  product_id: string;
  status: SubscriptionRecordStatus;
  platform: Subscription['platform'];
  started_at: string;
  expires_at: string | null;
};

export type SubscriptionChartRow = {
  started_at: string;
  status: SubscriptionRecordStatus;
};

export type StripeBillingType = 'monthly' | 'annual' | 'lifetime';

export type StripeProduct = {
  id: string;
  stripe_product_id: string;
  stripe_price_id: string | null;
  stripe_monthly_price_id: string | null;
  stripe_annual_price_id: string | null;
  name: string;
  description: string | null;
  billing_type: StripeBillingType;
  monthly_price: number | null;
  annual_price: number | null;
  trial_days: number | null;
  stripe_payment_link_id: string | null;
  stripe_payment_link_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type StripeProductRow = StripeProduct & {
  activeSubscribers: number;
  promoCodes: StripePromoCode[];
};

export type StripePromoCode = {
  id: string;
  stripe_product_id: string | null;
  stripe_coupon_id: string;
  stripe_promotion_code_id: string;
  code: string;
  percent_off: number | null;
  amount_off: number | null;
  currency: string | null;
  duration: 'once' | 'forever' | 'repeating';
  duration_in_months: number | null;
  max_redemptions: number | null;
  redeem_by: string | null;
  times_redeemed: number;
  active: boolean;
  created_at: string;
};

export type NewsletterCampaignStatus = 'draft' | 'sent' | 'failed';

export type NewsletterCampaign = {
  id: string;
  subject: string;
  preview: string | null;
  body: string;
  from_email: string;
  from_name: string | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: NewsletterCampaignStatus;
  created_at: string;
  sent_at: string | null;
};

export type NewsletterRecipient = Pick<
  Profile,
  'id' | 'email' | 'first_name' | 'last_name' | 'subscription_status' | 'created_at'
>;
