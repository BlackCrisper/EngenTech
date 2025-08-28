const bcrypt = require('bcryptjs');

const hashedPassword = '$2a$10$MRfrWuLkaRQQa35G.0iSpujMwvTfjMQeZbVDqnXRW/Mvg1cPeVzKi';

const testPasswords = [
  'admin123',
  '123456',
  'admin',
  'password',
  'administrador',
  'mizu',
  'engentech',
  'enginsync',
  'teste',
  '123',
  'abc123',
  'qwerty',
  'senha',
  'admin2024',
  'mizu2024'
];

async function testPasswords() {
  console.log('🔐 Testando senhas para o usuário administrador...\n');
  console.log(`Hash armazenado: ${hashedPassword}\n`);

  for (const password of testPasswords) {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      if (isMatch) {
        console.log(`✅ Senha encontrada: "${password}"`);
        return password;
      } else {
        console.log(`❌ "${password}" - não confere`);
      }
    } catch (error) {
      console.log(`❌ Erro ao testar "${password}":`, error.message);
    }
  }

  console.log('\n❌ Nenhuma senha testada funcionou');
  return null;
}

testPasswords();
