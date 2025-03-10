module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Remove the existing foreign key constraint
      await queryInterface.removeConstraint('task_history', 'task_history_ibfk_1');
      
      // Add the new constraint with CASCADE delete
      await queryInterface.addConstraint('task_history', {
        fields: ['task_id'],
        type: 'foreign key',
        name: 'task_history_task_id_fk',
        references: {
          table: 'tasks',
          field: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      
      console.log('Migration completed successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Migration failed:', error);
      return Promise.reject(error);
    }
  },
  
  down: async (queryInterface, Sequelize) => {
    try {
      // Remove the CASCADE constraint
      await queryInterface.removeConstraint('task_history', 'task_history_task_id_fk');
      
      // Add back the original constraint
      await queryInterface.addConstraint('task_history', {
        fields: ['task_id'],
        type: 'foreign key',
        name: 'task_history_ibfk_1',
        references: {
          table: 'tasks',
          field: 'id'
        }
      });
      
      console.log('Rollback completed successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Rollback failed:', error);
      return Promise.reject(error);
    }
  }
}; 