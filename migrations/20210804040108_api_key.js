
exports.up = function(knex) {
  return knex.schema.createTable('api_key', table => {

    table.specificType('id', 'char(36) primary key');
    table.string('name').notNullable()
    table.string('key').notNullable();
    table.text('scope').notNullable();
    table.timestamp('date_created').defaultTo(knex.fn.now());
    table.bool('active').notNullable().defaultTo(true);
    table.string('account_id', 36).notNullable().references('id').inTable('account').onDelete('cascade');
    
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('api_key');
};
