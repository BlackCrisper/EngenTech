const jwt = require('jsonwebtoken');

// Gerar token temporário para teste
const token = jwt.sign(
  {
    userId: 1,
    username: 'admin',
    role: 'admin',
    projectId: 1
  },
  'your-secret-key',
  { expiresIn: '1h' }
);

console.log('Token para teste:', token);
