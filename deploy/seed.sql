-- SnagChat admin API seed. Re-runnable: schema.sql must run first, every
-- statement is INSERT OR IGNORE so `npm run db:local` can be repeated.
-- Timestamps are relative to now so SLA clocks are always realistic.

-- ---------------------------------------------------------------- staff ---
-- Demo credentials (local seed only):
--   root@snagchat.io / SnagChat!Super1   superadmin
--   ops@snagchat.io  / SnagChat!Admin1   admin
--   mod@snagchat.io  / SnagChat!Mod1     moderator
INSERT OR IGNORE INTO staff (id, name, email, role, status, password_hash, created_at, last_login_at) VALUES
  ('stf_ada',   'Ada Okafor',      'root@snagchat.io', 'superadmin', 'active',
   'pbkdf2$120000$c25hZ2NoYXQtc2VlZC1zdXBlci0wMQ==$iKkXF2uMfK3cWKghFmj9jRQm0tRQPIa3RsV9+18dVXQ=',
   CAST(strftime('%s','now') AS INTEGER) - 86400 * 120, CAST(strftime('%s','now') AS INTEGER) - 5400),
  ('stf_marco', 'Marco Reyes',     'ops@snagchat.io',  'admin',      'active',
   'pbkdf2$120000$c25hZ2NoYXQtc2VlZC1hZG1pbi0wMQ==$p918wPTOYkeNttuloWhgqNW2yv+xn0/1eLky4RjNoGs=',
   CAST(strftime('%s','now') AS INTEGER) - 86400 * 90, CAST(strftime('%s','now') AS INTEGER) - 9100),
  ('stf_jules', 'Jules Whitfield', 'mod@snagchat.io',  'moderator',  'active',
   'pbkdf2$120000$c25hZ2NoYXQtc2VlZC1tb2QtMDE=$FQpPaXGKqXdI98ufGEc6RRkGJGUMMkPlgf76QVYTqn0=',
   CAST(strftime('%s','now') AS INTEGER) - 86400 * 60, CAST(strftime('%s','now') AS INTEGER) - 1200),
  ('stf_priya', 'Priya Nair',      'priya@snagchat.io','moderator',  'suspended',
   'pbkdf2$120000$c25hZ2NoYXQtc2VlZC1tb2QtMDE=$FQpPaXGKqXdI98ufGEc6RRkGJGUMMkPlgf76QVYTqn0=',
   CAST(strftime('%s','now') AS INTEGER) - 86400 * 45, NULL);

-- --------------------------------------------------------------- players ---
INSERT OR IGNORE INTO players
  (id, handle, name, verified, private_account, verification_requested, region, platform,
   status, status_until, strikes, posts, followers, joined_at, last_seen_at) VALUES
  ('masonr','masonr','MasonR',1,0,0,'US East','Both','active',NULL,0,412,15800, CAST(strftime('%s','now') AS INTEGER) - 86400*400, CAST(strftime('%s','now') AS INTEGER) - 900),
  ('luma','luma','Luma',1,0,0,'EU','PC','active',NULL,0,268,9420, CAST(strftime('%s','now') AS INTEGER) - 86400*330, CAST(strftime('%s','now') AS INTEGER) - 420),
  ('kirav','kirav','KiraV',0,0,0,'US West','Console','active',NULL,1,97,2140, CAST(strftime('%s','now') AS INTEGER) - 86400*210, CAST(strftime('%s','now') AS INTEGER) - 3600),
  ('vexx','vexx','vexx',0,0,0,'SEA','PC','timed_out', CAST(strftime('%s','now') AS INTEGER) + 6*3600,2,143,3860, CAST(strftime('%s','now') AS INTEGER) - 86400*180, CAST(strftime('%s','now') AS INTEGER) - 7200),
  ('drew','drew','Drew',0,0,0,'AU','Both','active',NULL,0,64,890, CAST(strftime('%s','now') AS INTEGER) - 86400*95, CAST(strftime('%s','now') AS INTEGER) - 5400),
  ('nyx','nyx','Nyx',0,1,0,'EU','PC','active',NULL,0,52,1270, CAST(strftime('%s','now') AS INTEGER) - 86400*150, CAST(strftime('%s','now') AS INTEGER) - 1800),
  ('aster','aster','Aster',1,0,0,'US East','PC','active',NULL,0,301,11200, CAST(strftime('%s','now') AS INTEGER) - 86400*290, CAST(strftime('%s','now') AS INTEGER) - 600),
  ('mira','mira','Mira',0,0,0,'US West','Console','active',NULL,0,77,1580, CAST(strftime('%s','now') AS INTEGER) - 86400*120, CAST(strftime('%s','now') AS INTEGER) - 2700),
  ('rook','rook','Rook',0,0,1,'AU','Both','active',NULL,0,118,2460, CAST(strftime('%s','now') AS INTEGER) - 86400*70, CAST(strftime('%s','now') AS INTEGER) - 1500),
  ('jax','jax','Jax',0,0,0,'SEA','PC','active',NULL,1,89,1930, CAST(strftime('%s','now') AS INTEGER) - 86400*140, CAST(strftime('%s','now') AS INTEGER) - 4800),
  ('noxx','noxx','noxx',0,0,0,'US East','Console','suspended', CAST(strftime('%s','now') AS INTEGER) + 72*3600,3,210,4310, CAST(strftime('%s','now') AS INTEGER) - 86400*260, CAST(strftime('%s','now') AS INTEGER) - 86400),
  ('otis','otis','Otis',0,0,0,'AU','PC','active',NULL,0,45,760, CAST(strftime('%s','now') AS INTEGER) - 86400*55, CAST(strftime('%s','now') AS INTEGER) - 7000),
  ('sable','sable','Sable',0,1,1,'EU','Console','active',NULL,0,61,1120, CAST(strftime('%s','now') AS INTEGER) - 86400*80, CAST(strftime('%s','now') AS INTEGER) - 2100),
  ('wren','wren','Wren',0,1,0,'US West','Both','active',NULL,0,38,640, CAST(strftime('%s','now') AS INTEGER) - 86400*40, CAST(strftime('%s','now') AS INTEGER) - 3300),
  ('kit','kit','Kit',0,0,0,'US East','PC','banned',NULL,5,176,3050, CAST(strftime('%s','now') AS INTEGER) - 86400*310, CAST(strftime('%s','now') AS INTEGER) - 86400*3);

-- --------------------------------------------------------------- content ---
INSERT OR IGNORE INTO content
  (id, author_id, title, game, category, media_kind, cover_url, state, likes, comments, saves, shares, created_at) VALUES
  ('sn_1','masonr','Solo raid clear on the north ridge','Rust','Clips','clip','/snags/ridge-light.jpg','allow',4820,312,1904,411, CAST(strftime('%s','now') AS INTEGER) - 86400*2),
  ('sn_2','vexx','Ranked lobby got personal','Call of Duty','Clips','clip','/snags/late-queue.jpg','allow',1290,204,318,88, CAST(strftime('%s','now') AS INTEGER) - 86400*1),
  ('sn_3','kit','FREE V-BUCKS GENERATOR - link in bio','Other','Skins','image','/snags/neon-district.jpg','allow',12,41,2,19, CAST(strftime('%s','now') AS INTEGER) - 7200),
  ('sn_4','luma','Desert base, day 40','ARK: Survival Ascended','Builds','image','/snags/desert-road.jpg','allow',2210,188,1440,266, CAST(strftime('%s','now') AS INTEGER) - 86400*3),
  ('sn_5','noxx','NorthLoop bundle ad read','Call of Duty','Clips','image','/snags/controller.jpg','allow',640,55,120,34, CAST(strftime('%s','now') AS INTEGER) - 86400*1 - 3600),
  ('sn_6','jax','Squad wipe montage - day one','Apex Legends','Clips','clip','/snags/squad-room.jpg','allow',3110,295,890,205, CAST(strftime('%s','now') AS INTEGER) - 86400*4),
  ('sn_7','mira','Beach event skin showcase','Conan Exiles','Skins','image','/snags/coastline.jpg','allow',820,96,143,27, CAST(strftime('%s','now') AS INTEGER) - 86400 - 7200),
  ('sn_8','aster','Full loadout breakdown - sniper support','DayZ','Loadouts','image','/snags/rig.jpg','allow',5240,410,2610,520, CAST(strftime('%s','now') AS INTEGER) - 86400*5),
  ('sn_9','drew','This aimbot is undetected, trust','Call of Duty','Clips','clip','/snags/arcade-run.jpg','allow',410,73,66,41, CAST(strftime('%s','now') AS INTEGER) - 86400*2 - 3600),
  ('sn_10','otis','Same frame, four different brands','Other','Skins','image','/snags/keyboard.jpg','allow',180,12,40,5, CAST(strftime('%s','now') AS INTEGER) - 86400 - 1800),
  ('sn_11','rook','PC build giveaway - click to enter','Other','Builds','image','/snags/rig.jpg','allow',95,30,11,60, CAST(strftime('%s','now') AS INTEGER) - 10800),
  ('sn_12','nyx','Fog castle tour, private build','Minecraft','Builds','image','/snags/castle-fog.jpg','allow',1470,102,980,143, CAST(strftime('%s','now') AS INTEGER) - 86400*6),
  ('sn_13','sable','Reuploaded from another creator','Palworld','Skins','image','/snags/stars.jpg','allow',300,44,51,12, CAST(strftime('%s','now') AS INTEGER) - 86400*3 - 7200),
  ('sn_14','kirav','Couch co-op night with the squad','Minecraft','Squad Galleries','image','/snags/couch-coop.jpg','allow',2640,187,720,158, CAST(strftime('%s','now') AS INTEGER) - 86400*7),
  ('sn_15','kit','Victory lap over the summit','Elden Ring','Clips','clip','/snags/summit.jpg','allow',770,61,150,33, CAST(strftime('%s','now') AS INTEGER) - 86400*2 - 5400),
  ('sn_16','luma','Lake run in the new skin pack','Rust','Skins','image','/snags/lake-fog.jpg','allow',3980,266,1810,377, CAST(strftime('%s','now') AS INTEGER) - 86400*8);

-- --------------------------------------------------------------- reports ---
-- SLA windows: critical 1h, high 4h, medium 12h, low 24h.
INSERT OR IGNORE INTO reports
  (id, content_id, mode, reason, detail, reporter_id, status, severity, assigned_to,
   resolution, resolved_by, resolved_at, resolution_note, created_at, updated_at, sla_due_at) VALUES
  ('rep_1','sn_3','post','Spam or a scam','Account posts the same link every day','mira','open','critical',NULL,
   NULL,NULL,NULL,NULL,
   CAST(strftime('%s','now') AS INTEGER) - 86400*1 - 3000,
   CAST(strftime('%s','now') AS INTEGER) - 86400 - 3000,
   CAST(strftime('%s','now') AS INTEGER) - 86400 + 600),
  ('rep_2','sn_15','post','Violence or gore','', 'otis','open','high',NULL,
   NULL,NULL,NULL,NULL,
   CAST(strftime('%s','now') AS INTEGER) - 9000,
   CAST(strftime('%s','now') AS INTEGER) - 9000,
   CAST(strftime('%s','now') AS INTEGER) - 9000 + 14400),
  ('rep_3','sn_11','post','Spam or a scam','Giveaway looks like a credential harvest','nyx','open','high',NULL,
   NULL,NULL,NULL,NULL,
   CAST(strftime('%s','now') AS INTEGER) - 2400,
   CAST(strftime('%s','now') AS INTEGER) - 2400,
   CAST(strftime('%s','now') AS INTEGER) - 2400 + 14400),
  ('rep_4','sn_2','post','Harassment or bullying','Replies target the same player repeatedly','drew','claimed','high','stf_jules',
   NULL,NULL,NULL,NULL,
   CAST(strftime('%s','now') AS INTEGER) - 5400,
   CAST(strftime('%s','now') AS INTEGER) - 5000,
   CAST(strftime('%s','now') AS INTEGER) - 5400 + 14400),
  ('rep_5','sn_9','post','Cheating, hacks or exploits','Clip shows a snap macro','aster','claimed','high','stf_jules',
   NULL,NULL,NULL,NULL,
   CAST(strftime('%s','now') AS INTEGER) - 6800,
   CAST(strftime('%s','now') AS INTEGER) - 6500,
   CAST(strftime('%s','now') AS INTEGER) - 6800 + 14400),
  ('rep_6','sn_13','post','Copyright or stolen work','Uploader admits it is reposted','luma','escalated','medium',NULL,
   NULL,NULL,NULL,'Second opinion requested on transformative use',
   CAST(strftime('%s','now') AS INTEGER) - 86400 - 7200,
   CAST(strftime('%s','now') AS INTEGER) - 21600,
   CAST(strftime('%s','now') AS INTEGER) - 86400 - 7200 + 43200),
  ('rep_7','sn_5','ad','Offensive content','Ad copy slurs in the creative','rook','escalated','high',NULL,
   NULL,NULL,NULL,'Advertiser escalation, needs admin sign-off',
   CAST(strftime('%s','now') AS INTEGER) - 14000,
   CAST(strftime('%s','now') AS INTEGER) - 7200,
   CAST(strftime('%s','now') AS INTEGER) - 14000 + 14400),
  ('rep_8','sn_10','ad','Repeats the same ad','Third identical flight this week','wren','open','low',NULL,
   NULL,NULL,NULL,NULL,
   CAST(strftime('%s','now') AS INTEGER) - 43200,
   CAST(strftime('%s','now') AS INTEGER) - 43200,
   CAST(strftime('%s','now') AS INTEGER) - 43200 + 86400),
  ('rep_9','sn_4','post','Something else','Cover does not match the title','otis','open','low',NULL,
   NULL,NULL,NULL,NULL,
   CAST(strftime('%s','now') AS INTEGER) - 7200,
   CAST(strftime('%s','now') AS INTEGER) - 7200,
   CAST(strftime('%s','now') AS INTEGER) - 7200 + 86400),
  ('rep_10','sn_1','post','Spam or a scam','Duplicate of an older post','kirav','resolved','medium',NULL,
   'dismiss','stf_jules', CAST(strftime('%s','now') AS INTEGER) - 86400 - 4000,
   'Same clip reposted once, no pattern',
   CAST(strftime('%s','now') AS INTEGER) - 86400 - 9000,
   CAST(strftime('%s','now') AS INTEGER) - 86400 - 4000,
   CAST(strftime('%s','now') AS INTEGER) - 86400 - 9000 + 43200),
  ('rep_11','sn_6','post','Violence or gore','In-game only, but reported twice','mira','resolved','high','stf_jules',
   'allow','stf_jules', CAST(strftime('%s','now') AS INTEGER) - 18000,
   'Within guidelines for the category',
   CAST(strftime('%s','now') AS INTEGER) - 86400 - 20000,
   CAST(strftime('%s','now') AS INTEGER) - 18000,
   CAST(strftime('%s','now') AS INTEGER) - 86400 - 20000 + 14400),
  ('rep_12','sn_3','post','Spam or a scam','Second reporter on the same account','sable','open','critical',NULL,
   NULL,NULL,NULL,NULL,
   CAST(strftime('%s','now') AS INTEGER) - 3000,
   CAST(strftime('%s','now') AS INTEGER) - 3000,
   CAST(strftime('%s','now') AS INTEGER) - 3000 + 3600);

-- ------------------------------------------------------------- audit log ---
INSERT OR IGNORE INTO audit_log
  (id, actor_id, actor_role, action, target_type, target_id, before, after, note, undone, created_at) VALUES
  (1,'stf_jules','moderator','report.decision.dismiss','report','rep_10',
   '{"status":"open"}','{"status":"resolved","resolution":"dismiss"}',
   'Same clip reposted once, no pattern',0, CAST(strftime('%s','now') AS INTEGER) - 86400 - 4000),
  (2,'stf_jules','moderator','report.decision.allow','report','rep_11',
   '{"status":"claimed","state":"allow"}','{"status":"resolved","resolution":"allow","state":"allow"}',
   'Within guidelines for the category',0, CAST(strftime('%s','now') AS INTEGER) - 18000),
  (3,'stf_marco','admin','report.decision.escalate','report','rep_7',
   '{"status":"open"}','{"status":"escalated"}',
   'Advertiser escalation, needs admin sign-off',0, CAST(strftime('%s','now') AS INTEGER) - 7200),
  (4,'stf_ada','superadmin','staff.role.change','staff','stf_priya',
   '{"role":"moderator","status":"active"}','{"role":"moderator","status":"suspended"}',
   'Account shared, suspended pending review',0, CAST(strftime('%s','now') AS INTEGER) - 86400 * 5);

-- --------------------------------------------------- creators & campaigns ---
INSERT OR IGNORE INTO creator_applications
  (id, player_id, store_name, category, payout_country, status, stripe_state, created_at) VALUES
  ('ca_1','masonr','Mason Metalworks','Frames','United States','pending','pending', CAST(strftime('%s','now') AS INTEGER) - 86400*2),
  ('ca_2','luma','Luma Lab','Banners','Germany','approved','active', CAST(strftime('%s','now') AS INTEGER) - 86400*30),
  ('ca_3','rook','Rook & Co','Avatars','Australia','pending','restricted', CAST(strftime('%s','now') AS INTEGER) - 86400*6),
  ('ca_4','aster','Aster Frames','Nameplates','United States','approved','active', CAST(strftime('%s','now') AS INTEGER) - 86400*18);

INSERT OR IGNORE INTO campaigns
  (id, advertiser, placement, budget_cents, spent_cents, status, flight_start, flight_end, created_at) VALUES
  ('cam_1','PadTek Gaming','feed',500000,214000,'in_review',
   CAST(strftime('%s','now') AS INTEGER) + 86400, CAST(strftime('%s','now') AS INTEGER) + 86400*15, CAST(strftime('%s','now') AS INTEGER) - 86400),
  ('cam_2','NorthLoop PC','story',750000,512000,'live',
   CAST(strftime('%s','now') AS INTEGER) - 86400*4, CAST(strftime('%s','now') AS INTEGER) + 86400*6, CAST(strftime('%s','now') AS INTEGER) - 86400*6),
  ('cam_3','PadTek Gaming','nameplate',250000,0,'approved',
   CAST(strftime('%s','now') AS INTEGER) + 86400*3, CAST(strftime('%s','now') AS INTEGER) + 86400*20, CAST(strftime('%s','now') AS INTEGER) - 86400*2),
  ('cam_4','NorthLoop PC','feed',300000,300000,'completed',
   CAST(strftime('%s','now') AS INTEGER) - 86400*30, CAST(strftime('%s','now') AS INTEGER) - 86400*16, CAST(strftime('%s','now') AS INTEGER) - 86400*32);

INSERT OR IGNORE INTO sales (id, product, creator_id, amount_cents, fee_cents, created_at) VALUES
  ('s_1','Ember Ring avatar frame','ca_2',499,12, CAST(strftime('%s','now') AS INTEGER) - 86400*9),
  ('s_2','Galaxy banner','ca_4',799,20, CAST(strftime('%s','now') AS INTEGER) - 86400*8),
  ('s_3','Frost Crown avatar frame','ca_2',499,12, CAST(strftime('%s','now') AS INTEGER) - 86400*7),
  ('s_4','Glitch Shift nameplate','ca_4',299,7,  CAST(strftime('%s','now') AS INTEGER) - 86400*6),
  ('s_5','Gold Laurel avatar frame','ca_2',499,12, CAST(strftime('%s','now') AS INTEGER) - 86400*5),
  ('s_6','Circuit Cyan banner','ca_4',799,20, CAST(strftime('%s','now') AS INTEGER) - 86400*4),
  ('s_7','Halo Violet avatar frame','ca_2',499,12, CAST(strftime('%s','now') AS INTEGER) - 86400*3),
  ('s_8','Ember Drift banner','ca_4',799,20, CAST(strftime('%s','now') AS INTEGER) - 86400*2),
  ('s_9','Glitch Shift nameplate','ca_2',299,7,  CAST(strftime('%s','now') AS INTEGER) - 86400),
  ('s_10','Gold Laurel avatar frame','ca_4',499,12, CAST(strftime('%s','now') AS INTEGER) - 3600);

-- -------------------------------------------------------- activity rollup ---
-- Day keys are floored to UTC midnight so re-seeding collides on the primary
-- key instead of appending a duplicate day. The table is rebuilt outright:
-- this file is a demo seed and is never run against production.
DELETE FROM activity_daily;
WITH RECURSIVE days(x) AS (SELECT 29 UNION ALL SELECT x - 1 FROM days WHERE x > 0)
INSERT OR IGNORE INTO activity_daily (day, posts, dau, new_players)
SELECT (CAST(strftime('%s','now') AS INTEGER) / 86400) * 86400 - x * 86400,
       180 + ((x * 37) % 90),
       38000 + ((x * 613) % 4000),
       240 + ((x * 29) % 160)
FROM days;
