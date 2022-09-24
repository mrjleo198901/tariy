
exports.up = function(knex) {
  return knex.schema.createTable('account_users', table => {

    table.increments('key').primary().unsigned();
    table.string('account_id', 36).notNullable().references('id').inTable('account').onDelete('cascade');
    table.string('user_id', 36).notNullable().references('id').inTable('user').onDelete('cascade');
    table.string('permission', 64).notNullable();
    table.bool('onboarded').notNullable().defaultTo(false);

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('account_users');
};
