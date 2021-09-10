const Sequelize = require('sequelize');

const sequelize = new Sequelize('renan', 'root', '123456', {
  host: 'localhost',
  dialect: 'mysql',
});

sequelize
  .authenticate()
  .then(function () {
    console.log('Conexao realizada com sucesso!!!');
  })
  .catch(function (err) {
    console.log('***SEM SUCESSO*** ' + err);
  });

module.exports = sequelize;
