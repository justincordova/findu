-- Insert Universities and Domains for NJIT, Northeastern, and Rutgers

-- Insert Universities
-- Note: IDs use CUID format. 

INSERT INTO universities (id, name, slug, created_at, updated_at)
VALUES
  (gen_random_uuid()::text, 'New Jersey Institute of Technology', 'njit', NOW(), NOW()),
  (gen_random_uuid()::text, 'Northeastern University', 'northeastern', NOW(), NOW()),
  (gen_random_uuid()::text, 'Rutgers University', 'rutgers', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- NJIT
INSERT INTO university_domains (id, university_id, domain, created_at, updated_at)
SELECT 
  gen_random_uuid()::text,
  u.id,
  'njit.edu',
  NOW(),
  NOW()
FROM universities u
WHERE u.slug = 'njit'
ON CONFLICT (university_id, domain) DO NOTHING;

-- Northeastern
INSERT INTO university_domains (id, university_id, domain, created_at, updated_at)
SELECT 
  gen_random_uuid()::text,
  u.id,
  'northeastern.edu',
  NOW(),
  NOW()
FROM universities u
WHERE u.slug = 'northeastern'
ON CONFLICT (university_id, domain) DO NOTHING;

-- Rutgers - Main domain
INSERT INTO university_domains (id, university_id, domain, created_at, updated_at)
SELECT 
  gen_random_uuid()::text,
  u.id,
  'rutgers.edu',
  NOW(),
  NOW()
FROM universities u
WHERE u.slug = 'rutgers'
ON CONFLICT (university_id, domain) DO NOTHING;

-- Rutgers - ScarletMail domain
INSERT INTO university_domains (id, university_id, domain, created_at, updated_at)
SELECT 
  gen_random_uuid()::text,
  u.id,
  'scarletmail.rutgers.edu',
  NOW(),
  NOW()
FROM universities u
WHERE u.slug = 'rutgers'
ON CONFLICT (university_id, domain) DO NOTHING;

-- Verify the inserts
SELECT 
  u.name AS university_name,
  u.slug,
  ud.domain
FROM universities u
LEFT JOIN university_domains ud ON u.id = ud.university_id
WHERE u.slug IN ('njit', 'northeastern', 'rutgers')
ORDER BY u.name, ud.domain;
