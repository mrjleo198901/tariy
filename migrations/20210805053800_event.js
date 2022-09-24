
exports.up = function(knex) {
  return knex.schema.createTable('event', table => {

    table.specificType('id', 'char(36) primary key');
    table.string('name').notNullable();
    table.string('metadata');
    table.timestamp('time').defaultTo(knex.fn.now()).notNullable();
    table.string('user_id', 36);
    table.string('account_id', 36);
    
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('event');
};