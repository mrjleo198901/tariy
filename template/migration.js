exports.up = function(knex) {
  return knex.schema.createTable('{{view}}', table => {

    table.specificType('id', 'char(36) primary key');
    table.string('name', 32).notNullable();
    table.timestamps(true, true);
    table.string('account_id', 36).notNullable().references('id').inTable('account').onDelete('cascade');

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('{{view}}');
};
