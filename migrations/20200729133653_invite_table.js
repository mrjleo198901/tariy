exports.up = function(knex) {
  return knex.schema.createTable('invite', table => {

    table.specificType('id', 'char(16) primary key');
    table.string('email', 512).notNullable();
    table.string('permission', 32).defaultTo('user');
    table.string('account_id', 36).notNullable();
    table.timestamp('date_sent').notNullable();
    table.bool('used').notNullable();

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('invite');
  
};
