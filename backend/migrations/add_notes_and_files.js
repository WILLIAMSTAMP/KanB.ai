/**
 * Migration to add notes and file_attachments columns to tasks table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add notes column
      await queryInterface.addColumn('tasks', 'notes', {
        type: Sequelize.TEXT,
        allowNull: true
      });
      
      // Add file_attachments column
      await queryInterface.addColumn('tasks', 'file_attachments', {
        type: Sequelize.JSON,
        allowNull: true
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
      // Remove notes column
      await queryInterface.removeColumn('tasks', 'notes');
      
      // Remove file_attachments column
      await queryInterface.removeColumn('tasks', 'file_attachments');
      
      console.log('Rollback completed successfully');
      return Promise.resolve();
    } catch (error) {
      console.error('Rollback failed:', error);
      return Promise.reject(error);
    }
  }
}; 