export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          email_notifications: boolean;
          push_notifications: boolean;
          privacy_public_profile: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          email_notifications?: boolean;
          push_notifications?: boolean;
          privacy_public_profile?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          email_notifications?: boolean;
          push_notifications?: boolean;
          privacy_public_profile?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // ... rest of the types remain the same
    };
  };
}