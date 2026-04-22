export type Charity = {
  id: string;
  name: string;
  description: string;
  impact_summary: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  charity_id: string | null;
  created_at: string;
  updated_at: string;
  charities?: Pick<Charity, "name"> | null;
};

export type Score = {
  id: string;
  user_id: string;
  score: number;
  played_on: string;
  created_at: string;
};

export type AdminScore = Score & {
  users?: Pick<UserProfile, "email" | "full_name"> | null;
};

export type Draw = {
  id: string;
  draw_date: string;
  drawn_numbers: number[];
  status: "simulated" | "published";
  triggered_by: string | null;
  created_at: string;
  users?: Pick<UserProfile, "email"> | null;
};

export type Message = {
  type: "success" | "error" | "info";
  text: string;
};
