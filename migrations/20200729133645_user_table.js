
exports.up = function(knex) {
  return knex.schema.createTable('user', table => {

    table.specificType('id', 'char(36) primary key');
    table.string('name', 32).notNullable();
    table.string('email').notNullable();
    table.string('password');
    table.timestamp('date_created').notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_active').defaultTo(knex.fn.now());
    table.bool('support_enabled').notNullable().defaultTo(false);
    table.bool('2fa_enabled').notNullable().defaultTo(false);
    table.text('2fa_secret');
    table.text('2fa_backup_code');
    table.bool('disabled').notNullable().defaultTo(false);
    table.string('facebook_id', 128);
    table.string('twitter_id', 128);
    table.string('default_account', 36).notNullable();

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user');
};
