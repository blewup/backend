'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const addIndexSafely = async (tableName, fields, options = {}) => {
      const indexName = options.name || `${tableName}_${fields.join('_')}`;
      try {
        await queryInterface.addIndex(tableName, fields, { ...options, name: indexName });
      } catch (error) {
        const duplicateKey = error?.original?.code === 'ER_DUP_KEYNAME' || error?.original?.errno === 1061;
        if (!duplicateKey) {
          throw error;
        }
      }
    };

    const addConstraintSafely = async (tableName, options) => {
      try {
        await queryInterface.addConstraint(tableName, options);
      } catch (error) {
        const duplicateKey = error?.original?.code === 'ER_DUP_KEYNAME' || error?.original?.errno === 1061;
        if (!duplicateKey) {
          throw error;
        }
      }
    };

    await queryInterface.createTable('event_rsvps', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'events', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      response: {
        type: Sequelize.ENUM('attending', 'interested', 'not_attending'),
        allowNull: false,
        defaultValue: 'interested',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        onUpdate: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await addIndexSafely('event_rsvps', ['event_id']);
    await addIndexSafely('event_rsvps', ['user_id']);
    await addIndexSafely('event_rsvps', ['response']);
    await addConstraintSafely('event_rsvps', {
      fields: ['event_id', 'user_id'],
      type: 'unique',
      name: 'unique_event_rsvp',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('event_rsvps');
  },
};
