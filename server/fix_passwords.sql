-- Fix passwords (admin123 for both)
-- Generated with bcrypt.hash('admin123', 10)
UPDATE users SET password = '$2a$10$DdMVbfbLm3QqyIOIvmjjgOHXzfUcI144fPS7V7JR7WUnGdFVplkq' WHERE username = 'admin';
UPDATE users SET password = '$2a$10$DdMVbfbLm3QqyIOIvmjjgOHXzfUcI144fPS7V7JR7WUnGdFVplkq' WHERE username = 'secretaire';
