-- SnagChat admin API schema (D1 / SQLite).
-- Applied locally by `npm run db:local`; the hosted copy is created by the
-- platform and bound as `DB`. Idempotent so it can be re-run.

CREATE TABLE IF NOT EXISTS staff (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'moderator')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  staff_id   TEXT NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_staff ON sessions (staff_id);

CREATE TABLE IF NOT EXISTS players (
  id                    TEXT PRIMARY KEY,
  handle                TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  avatar_url            TEXT,
  verified              INTEGER NOT NULL DEFAULT 0,
  private_account       INTEGER NOT NULL DEFAULT 0,
  verification_requested INTEGER NOT NULL DEFAULT 0,
  region                TEXT NOT NULL,
  platform              TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'timed_out', 'suspended', 'banned')),
  status_until          INTEGER,
  strikes               INTEGER NOT NULL DEFAULT 0,
  posts                 INTEGER NOT NULL DEFAULT 0,
  followers             INTEGER NOT NULL DEFAULT 0,
  joined_at             INTEGER NOT NULL,
  last_seen_at          INTEGER
);

CREATE TABLE IF NOT EXISTS content (
  id         TEXT PRIMARY KEY,
  author_id  TEXT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  game       TEXT NOT NULL,
  category   TEXT NOT NULL CHECK (category IN ('Clips', 'Loadouts', 'Skins', 'Builds', 'Squad Galleries')),
  media_kind TEXT NOT NULL CHECK (media_kind IN ('image', 'clip')),
  cover_url  TEXT,
  state      TEXT NOT NULL DEFAULT 'allow' CHECK (state IN ('allow', 'interstitial', 'drop')),
  likes      INTEGER NOT NULL DEFAULT 0,
  comments   INTEGER NOT NULL DEFAULT 0,
  saves      INTEGER NOT NULL DEFAULT 0,
  shares     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_content_author ON content (author_id);

CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  content_id    TEXT NOT NULL REFERENCES content (id) ON DELETE CASCADE,
  mode          TEXT NOT NULL CHECK (mode IN ('post', 'ad')),
  reason        TEXT NOT NULL,
  detail        TEXT,
  reporter_id   TEXT,
  status        TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'claimed', 'escalated', 'resolved')),
  severity      TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  assigned_to   TEXT REFERENCES staff (id) ON DELETE SET NULL,
  resolution    TEXT,
  resolved_by   TEXT,
  resolved_at   INTEGER,
  resolution_note TEXT,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  sla_due_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_assigned ON reports (assigned_to, status);

-- Staff actions. `before`/`after` are JSON snapshots used by the 5s undo.
CREATE TABLE IF NOT EXISTS audit_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id    TEXT NOT NULL,
  actor_role  TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  before      TEXT,
  after       TEXT,
  note        TEXT,
  undone      INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log (actor_id, created_at);

CREATE TABLE IF NOT EXISTS creator_applications (
  id             TEXT PRIMARY KEY,
  player_id      TEXT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
  store_name     TEXT NOT NULL,
  category       TEXT NOT NULL,
  payout_country TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  stripe_state   TEXT NOT NULL CHECK (stripe_state IN ('none', 'pending', 'restricted', 'active')),
  created_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_creators_status ON creator_applications (status);

CREATE TABLE IF NOT EXISTS campaigns (
  id           TEXT PRIMARY KEY,
  advertiser   TEXT NOT NULL,
  placement    TEXT NOT NULL CHECK (placement IN ('feed', 'story', 'nameplate')),
  budget_cents INTEGER NOT NULL,
  spent_cents  INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'live', 'completed')),
  flight_start INTEGER NOT NULL,
  flight_end   INTEGER NOT NULL,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns (status);

CREATE TABLE IF NOT EXISTS sales (
  id         TEXT PRIMARY KEY,
  product    TEXT NOT NULL,
  creator_id TEXT REFERENCES creator_applications (id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  fee_cents  INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales (created_at);

-- Daily rollup the dashboards chart from: a real build would fill this from
-- job runs, the seed backfills 30 days.
CREATE TABLE IF NOT EXISTS activity_daily (
  day         INTEGER PRIMARY KEY,
  posts       INTEGER NOT NULL,
  dau         INTEGER NOT NULL,
  new_players INTEGER NOT NULL
);
