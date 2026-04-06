-- Update secretaire password
UPDATE users SET password = '$2a$10$/9FomcEXACNN9I3t2KXMoOgxlgM5fDv5BpSOv0d67bnFFrboOUsmm' WHERE username = 'secretaire';
-- Update admin password
UPDATE users SET password = '$2a$10$z1LQrj5I76HNurNLibJYPO4aau3KzBDaUjEl7CoLK7yxhFqu6pmAW' WHERE username = 'admin';
