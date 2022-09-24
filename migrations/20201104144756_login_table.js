
exports.up = function(knex) {
  return knex.schema.createTable('login', table => {

    table.specificType('id', 'char(36) primary key');
    table.timestamp('time').notNullable().defaultTo(knex.fn.now());
    table.string('ip', 45).notNullable();
    table.string('browser', 256);
    table.string('device', 256);
    table.string('user_id', 36).notNullable().references('id').inTable('user').onDelete('cascade');

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('login');
};
