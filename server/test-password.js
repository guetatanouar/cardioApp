const bcrypt = require('bcryptjs');

const testPassword = 'admin123';
const storedHash = '$2a$10$7LFCjflnA1.QScHurj/KTutVt4j3v5HRZ9/I9tBnwrRj1Qbpj0v7W';

console.log('Testing password:', testPassword);
console.log('Hash:', storedHash);

bcrypt.compare(testPassword, storedHash).then(match => {
  console.log('Match result:', match);
});

bcrypt.hash(testPassword, 10).then(newHash => {
  console.log('New hash:', newHash);
});
