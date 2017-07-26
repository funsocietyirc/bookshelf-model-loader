'use strict';
var expect = require('chai').expect;
var knexConfig = {
  client: 'sqlite3',
  connection: {
    filename: './test/tests.sqlite',
  },
  useNullAsDefault: true,
  debug: true
};
var Bookshelf = require('bookshelf');
var bookshelf = Bookshelf(require('knex')(knexConfig));

describe('bookshelf-model-loader tests', function () {

  before(function (done) {
    bookshelf.knex.schema.dropTableIfExists('users')
      .then(function () {
        return bookshelf.knex.schema.createTable('users', function(table) {
            table.increments()
            table.integer('account_id')
            table.timestamps()
            table.timestamp('deleted_at')
          });
      })
      .then(function () {
        return bookshelf.knex('users').insert([{
          id: 1,
          created_at: new Date(),
          updated_at: new Date(),
        }, {
          id: 2,
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: new Date(),
        }])
      }).then(function () {
        return done();
      });
  });

  it('should throw an error if the `path` isn\'t defined', function () {
    expect(function () {
      require('../').init(bookshelf);
    }).to.throw('You must specify the `path` option');
  });


  it('shouldn\'t add the base model if specified', function () {
    var Models = require('../').init(bookshelf, {
      excludes: ['user.js'],
      includeBase: false,
      path: __dirname + '/models'
    });

    expect(Models.Base).to.be.a('undefined');
  });


  it('should add the base model to itself', function () {
    var Models = require('../').init(bookshelf, {
      path: __dirname + '/models'
    });

    expect(Models.Base).to.be.a('function');
    expect(Models.Bookshelf).to.be.a('object');
  });


  it('should add the required model to itself', function () {
    var Models = require('../').init(bookshelf, {
      path: __dirname + '/models'
    });

    expect(Models.User).to.be.a('function');
  });


  it('should have a `paginate` method', function () {
    var Models = require('../').init(bookshelf, {
      path: __dirname + '/models'
    });

    expect(Models.User.paginate).to.be.a('function');
  });


  it('should return a list of the users', function () {
    var Models = require('../').init(bookshelf, {
      path: __dirname + '/models'
    });

    return Models.User.paginate().then(function (users) {
      expect(users).to.be.a('object');
      expect(users.items).to.be.a('object');
      expect(users.meta).to.be.a('object');
    });

  });


  it('should find the user', function () {
    var Models = require('../').init(bookshelf, {
      path: __dirname + '/models'
    });

    return Models.User.findOne({id: 1}).then(function (user) {
      expect(user).to.be.a('object');
    });
  });


  it('should soft delete the user', function () {
    var Models = require('../').init(bookshelf, {
      path: __dirname + '/models'
    })

    return Models.User.destroy({id: 1})
    .then(function (user) {
      expect(user).to.be.a('object');
      expect(user.get('deleted_at')).not.equal(null);
    })
    .then(function () {
      Models.User.findOne({id: 1}, {withTrashed: true}).then(function (user) {
        expect(user).to.be.a('object');
        expect(user.get('deleted_at')).not.equal(null);
      })
    });

  });


  it('not return a soft deleted user', function () {
    var Models = require('../').init(bookshelf, {
      path: __dirname + '/models'
    })

    return Models.User.findOne({id: 2}).then(function (user) {
      expect(user).to.be(null);
    })
    .catch(() => {});

  });


  it('if force delete is true the record should be deleted', function () {
    var Models = require('../').init(bookshelf, {
      path: __dirname + '/models'
    })

    return Models.User.destroy({id: 1, forceDelete: true}).then(function (user) {
      Models.User.findOne({id: 1}, {withTrashed: true}).then(function (user) {
        expect(user).to.equal(null);
      })
      .catch(() => {});
    });

  })
});
