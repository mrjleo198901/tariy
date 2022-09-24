exports.up = function(knex) {
  return knex.schema.createTable('feedback', table => {

    table.specificType('id', 'char(36) primary key');
    table.string('rating', 12);
    table.text('comment');
    table.timestamp('date_created').notNullable().defaultTo(knex.fn.now());
    table.string('user_id', 36).notNullable().references('id').inTable('user').onDelete('cascade');

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('feedback');
};
