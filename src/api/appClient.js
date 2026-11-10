import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const initialRecoveryHash = typeof window === "undefined"
  ? ""
  : window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
export const recoveryLinkAtLoad = typeof window !== "undefined" && (
  new URLSearchParams(initialRecoveryHash).get("type") === "recovery" ||
  new URLSearchParams(window.location.search).get("type") === "recovery" ||
  new URLSearchParams(window.location.search).has("token_hash")
);

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

const TABLES = {
  Exam: "exams",
  Habit: "habits",
  HabitLog: "habit_logs",
  Note: "notes",
  StudySession: "study_sessions",
  Subject: "subjects",
  Task: "tasks",
};

const PROFILE_FIELDS = new Set([
  "full_name", "education_level", "avatar_url", "theme",
  "notifications_enabled", "daily_goal_minutes", "daily_study_minutes",
  "daily_study_day", "goal_met_day", "xp", "level", "current_streak",
  "longest_streak", "last_study_day", "focus_preset", "onboarding_complete",
  "earned_achievements",
]);

function client() {
  if (!supabase) {
    throw new Error("StudyMate is not connected to its database yet. Supabase environment settings are missing.");
  }
  return supabase;
}

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

async function currentUserId() {
  const { data, error } = await client().auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in to continue.");
  return data.user.id;
}

function applyFilters(query, filters = {}) {
  for (const [field, value] of Object.entries(filters)) {
    if (value && typeof value === "object" && Array.isArray(value.$in)) {
      query = query.in(field, value.$in);
    } else if (value === null) {
      query = query.is(field, null);
    } else {
      query = query.eq(field, value);
    }
  }
  return query;
}

function applyOrder(query, sort) {
  if (!sort) return query;
  const descending = sort.startsWith("-");
  const column = descending ? sort.slice(1) : sort;
  return query.order(column, { ascending: !descending, nullsFirst: false });
}

function createEntityApi(table) {
  return {
    async list(sort, limit) {
      let query = client().from(table).select("*");
      query = applyOrder(query, sort);
      if (Number.isFinite(limit)) query = query.limit(limit);
      return unwrap(await query);
    },

    async filter(filters = {}, sort, limit) {
      let query = applyFilters(client().from(table).select("*"), filters);
      query = applyOrder(query, sort);
      if (Number.isFinite(limit)) query = query.limit(limit);
      return unwrap(await query);
    },

    async create(values) {
      const userId = await currentUserId();
      const { user_id: _ignored, ...safeValues } = values;
      return unwrap(await client().from(table).insert({ ...safeValues, user_id: userId }).select().single());
    },

    async bulkCreate(rows) {
      const userId = await currentUserId();
      const safeRows = rows.map(({ user_id: _ignored, ...row }) => ({ ...row, user_id: userId }));
      return unwrap(await client().from(table).insert(safeRows).select());
    },

    async update(id, values) {
      const userId = await currentUserId();
      const { user_id: _ignored, ...safeValues } = values;
      return unwrap(await client().from(table).update(safeValues).eq("id", id).eq("user_id", userId).select().single());
    },

    async delete(id) {
      const userId = await currentUserId();
      return unwrap(await client().from(table).delete().eq("id", id).eq("user_id", userId).select().maybeSingle());
    },

    async deleteMany(filters = {}) {
      const userId = await currentUserId();
      let query = applyFilters(client().from(table).delete(), filters).eq("user_id", userId);
      return unwrap(await query.select("id"));
    },
  };
}

const entities = Object.fromEntries(
  Object.entries(TABLES).map(([name, table]) => [name, createEntityApi(table)]),
);

async function getProfile() {
  const api = client();
  const { data: authData, error: authError } = await api.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Please sign in to continue.");

  const profile = unwrap(await api.from("profiles").select("*").eq("id", authData.user.id).single());
  return { ...profile, id: authData.user.id, email: authData.user.email };
}

export const appApi = {
  app: {
    async getPublicSettings() {
      client();
      return { id: "studymate", public_settings: {} };
    },
  },

  auth: {
    async me() {
      return getProfile();
    },

    async getSession() {
      const { data, error } = await client().auth.getSession();
      if (error) throw error;
      return data.session;
    },

    async loginViaEmailPassword(email, password) {
      return unwrap(await client().auth.signInWithPassword({ email, password }));
    },

    async register({ email, password }) {
      return unwrap(await client().auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/` },
      }));
    },

    async verifyOtp({ email, otpCode }) {
      return unwrap(await client().auth.verifyOtp({ email, token: otpCode, type: "signup" }));
    },

    async resendOtp(email) {
      return unwrap(await client().auth.resend({ type: "signup", email }));
    },

    async loginWithProvider(provider, returnTo = "/") {
      const redirectTo = new URL(returnTo, window.location.origin).toString();
      return unwrap(await client().auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      }));
    },

    async logout(redirectTo) {
      unwrap(await client().auth.signOut());
      if (redirectTo) window.location.assign(redirectTo);
    },

    redirectToLogin(currentUrl = window.location.href) {
      const parsed = new URL(currentUrl, window.location.origin);
      const returnTo = `${parsed.pathname}${parsed.search}`;
      window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    },

    async updateMe(values) {
      const userId = await currentUserId();
      const safeValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => PROFILE_FIELDS.has(key)),
      );
      return unwrap(await client().from("profiles").update(safeValues).eq("id", userId).select().single());
    },

    async resetPasswordRequest(email) {
      return unwrap(await client().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      }));
    },

    async updatePassword(newPassword) {
      return unwrap(await client().auth.updateUser({ password: newPassword }));
    },
  },

  entities,

  storage: {
    async uploadPublicFile({ file }) {
      const userId = await currentUserId();
      const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const extension = extensions[file.type];
      if (!extension) throw new Error("Choose a JPG, PNG, or WebP image.");
      if (file.size > 10 * 1024 * 1024) throw new Error("The image must be smaller than 10 MB.");

      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      unwrap(await client().storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      }));
      const { data } = client().storage.from("avatars").getPublicUrl(path);
      return { file_url: data.publicUrl };
    },
  },
};
