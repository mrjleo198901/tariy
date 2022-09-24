
exports.up = function(knex) {
  return knex.schema.createTable('push_token', table => {

    table.increments('key').primary().unsigned();
    table.string('user', 36).notNullable().references('id').inTable('user').onDelete('cascade');
    table.string('token', 36).notNullable();

  });
};

exports.down = function(knex) {
  return knex.dropTable('push_token');
};
