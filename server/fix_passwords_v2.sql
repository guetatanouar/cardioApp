-- Fix passwords properly using dollar-quoting to avoid escape issues
UPDATE users SET password = '$2a$10$DdMVbfbLm3QqyIOIvmjjgOHXzfUcI144fPS7V7JR7WUnGdFVplkq' WHERE username = 'admin';
UPDATE users SET password = '$2a$10$DdMVbfbLm3QqyIOIvmjjgOHXzfUcI144fPS7V7JR7WUnGdFVplkq' WHERE username = 'secretaire';
