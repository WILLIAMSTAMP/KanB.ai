const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const db = require('./app/models');
const User = db.User;

async function seedUsers() {
  try {
    console.log('Seeding users...');
    console.log(`DB_NAME: ${process.env.DB_NAME}`);
    console.log(`DB_USERNAME: ${process.env.DB_USERNAME}`);
    console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD}`);
    console.log(`DB_HOST: ${process.env.DB_HOST}`);
    console.log(`DB_PORT: ${process.env.DB_PORT}`);
    console.log(`DB_DIALECT: ${process.env.DB_DIALECT}`);

    await db.sequelize.sync(); // Ensure models are synced

    const user = await User.findOne({ where: { id: 1 } });
    if (!user) {
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123', // Password will be hashed via hooks
        role: 'admin',
        skills: ['JavaScript', 'React', 'Node.js'],
        current_workload: 0,
        workload_capacity: 40,
        avatar_url: null
      });
      console.log('Default user created.');
    } else {
      console.log('Default user already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();