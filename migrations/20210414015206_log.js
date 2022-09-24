
exports.up = function(knex) {
  return knex.schema.createTable('log', table => {

    table.specificType('id', 'char(36) primary key');
    table.timestamp('time').defaultTo(knex.fn.now());
    table.text('message');
    table.text('body');
    table.string('method', 64);
    table.string('endpoint');
    table.string('account_id', 36);
    table.string('user_id', 36);

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('log');
};
