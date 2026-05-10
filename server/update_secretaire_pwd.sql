-- Mettre le meme mot de passe que admin (admin123)
-- Hash genere avec bcrypt.hash('admin123', 10)
UPDATE users SET password = '$2a$10$zbENkuvi28cBZp7tstl4AeVoqa/lthxPvx4xGcaAr9Fp.2Ccaekp6' WHERE username = 'secretaire';
