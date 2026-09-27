import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    API_URL:
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.BACKEND_URL ||
      'https://teto-b.onrender.com',
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      process.env.BACKEND_URL ||
      'https://teto-b.onrender.com',
    SUPABASE_URL:
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      'https://qowzmhcydxxfbtrzangl.supabase.co',
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      'https://qowzmhcydxxfbtrzangl.supabase.co',
    SUPABASE_ANON_KEY:
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      'sb_publishable_mOc3dW_eS63LUursi357Jw_rBsKOGaX',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      'sb_publishable_mOc3dW_eS63LUursi357Jw_rBsKOGaX',
  },
};

export default nextConfig;
