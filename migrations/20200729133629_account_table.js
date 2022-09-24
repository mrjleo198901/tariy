
exports.up = function(knex) {
  return knex.schema.createTable('account', table => {

    table.specificType('id', 'char(36) primary key');
    table.string('name', 256);
    table.timestamp('date_created').defaultTo(knex.fn.now());
    table.string('stripe_customer_id', 32);
    table.string('stripe_subscription_id', 32);
    table.string('plan', 64);
    table.bool('active').notNullable();

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('account');
};
