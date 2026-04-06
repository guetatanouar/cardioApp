-- Reset passwords
-- admin123
UPDATE users SET password = '$2a$10$DdMVbfbLm3QqyIOIvmjjgOHXzfUcI144fPS7V7JR7WUnGdFVplkqC' WHERE username = 'admin';
-- sec123
UPDATE users SET password = '$2a$10$DdMVbfbLm3QqyIOIvmjjgOHXzfUcI144fPS7V7JR7WUnGdFVplkqC' WHERE username = 'secretaire';
