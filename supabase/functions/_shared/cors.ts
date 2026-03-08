// CORS restringido: solo permitir requests desde la app y Supabase dashboard
export const corsHeaders = {
  "Access-Control-Allow-Origin": "https://drwxgdwtlcvgiihwvgxd.supabase.co",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
