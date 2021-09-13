const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
// const saltRounds = 10;
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const app = express();

const Produto = require('./models/Produtos');
const Usuario = require('./models/Usuarios');

app.use(express.json());
// middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET', 'PUT', 'POST', 'DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type', 'Authorization');
  res.header(
    'Access-Control-Allow-Headers',
    'X-PINGOTHER',
    'Content-Type',
    'Authorization',
  );
  app.use(cors());
  next();
});
//CADASTRO DE PRODUTOS
app.get('/list-produto', validarToken, async (req, res) => {
  await Produto.findAll({
    attributes: ['id', 'nome', 'preco_compra', 'preco_venda', 'quantidade'],
    order: [['id', 'DESC']],
  })
    .then((produtos) => {
      return res.json({
        error: false,
        produtos,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        mensagem: 'Erro: Nenhum produto cadastrado!!!',
      });
    });
});

app.get('/view-produto/:id', validarToken, async (req, res) => {
  const { id } = req.params;
  await Produto.findByPk(id)
    .then((produto) => {
      return res.json({
        error: false,
        produto,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        mensagem: 'Erro: Nenhum produto cadastrado esse ID',
      });
    });
});

app.post('/cad-produto', validarToken, async (req, res) => {
  await Produto.create(req.body)
    .then(() => {
      return res.json({
        error: false,
        mensagem: 'Produto cadastrado com sucesso!!!',
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        mensagem: 'Erro: Produto nao cadastrado com sucesso!!!',
      });
    });
});

app.put('/edit-produto/', validarToken, async (req, res) => {
  const { id } = req.body;
  await Produto.update(req.body, {
    where: {
      id,
    },
  })
    .then(() => {
      return res.json({
        error: false,
        mensagem: 'Produto editado com sucesso!!!',
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        mensagem: 'Erro: Produto nao editado com sucesso!!!',
      });
    });
});

app.delete('/delete/:id', validarToken, async (req, res) => {
  const { id } = req.params;
  await Produto.destroy({
    where: {
      id,
    },
  })
    .then(() => {
      return res.json({
        error: false,
        mensagem: 'Produto excluido!!!',
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        mensagem: 'Erro: Produto nao excluido!!!',
      });
    });
});

// USUARIOS
app.delete('/delete-user/:id', validarToken, async (req, res) => {
  const { id } = req.params;
  await Usuario.destroy({
    where: {
      id,
    },
  })
    .then(() => {
      return res.json({
        error: false,
        mensagem: 'Usuario excluido com sucesso!!!',
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        mensagem: 'Erro: Usuario nao excluido!',
      });
    });
});
app.post('/cad-user', validarToken, async (req, res) => {
  var dados = req.body;

  dados.password = await bcrypt.hash(dados.password, 10);

  await Usuario.create(req.body)
    .then(() => {
      return res.json({
        error: false,
        mensagem: 'Usuario Cadastrado com sucesso!!!',
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({
        error: true,
        mensagem: 'Erro: Usuario não cadastrado',
      });
    });
});
app.put('/edit-user/', validarToken, async (req, res) => {
  const { id } = req.body;
  const dados = req.body;
  //Encrypt password
  dados.password = await bcrypt.hash(dados.password, 10);
  await Usuario.update(dados, {
    where: {
      id,
    },
  })
    .then(() => {
      return res.json({
        error: false,
        mensagem: 'Usuario editado com sucesso!!!',
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        mensagem: 'Usuario não editado',
      });
    });
});
app.get('/list-users', validarToken, async (req, res) => {
  await Usuario.findAll({
    attributes: ['id', 'nome', 'email'],
    order: [['id', 'DESC']],
  })
    .then((usuarios) => {
      return res.json({
        error: false,
        usuarios,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        mensagem: 'Nenhum usuario cadastrado',
      });
    });
});
app.get('/view-users/:id', validarToken, async (req, res) => {
  const { id } = req.params;
  await Usuario.findByPk(id)
    .then((usuario) => {
      return res.json({
        error: false,
        usuario,
      });
    })
    .catch((err) => {
      return res.status(400).json({
        error: true,
        mensagem: 'Erro: Nenhum produto cadastrado esse ID',
      });
    });
});
app.post('/login', async (req, res) => {
  const user = await Usuario.findOne({
    attributes: ['id', 'nome', 'email', 'password'],
    where: {
      email: req.body.email,
    },
  });
  if (user === null) {
    return res.status(400).json({
      error: true,
      mensagem: 'Error: User or password incorrect!!!',
    });
  }
  if (!(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(400).json({
      error: true,
      mensagem: 'Error: User or password incorrect!!!',
    });
  }
  var token = jwt.sign({ id: user.id }, 'd41d8cd98f00b204e9800998ecf8427e', {
    expiresIn: 6000,
  });
  return res.json({
    error: false,
    token,
  });
});

async function validarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(400).json({
      error: true,
      mensagem: 'Error: Login required!!!',
    });
  }
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(400).json({
      error: true,
      mensagem: 'Error: Login required!!!',
    });
  }
  try {
    const decoded = await promisify(jwt.verify)(
      token,
      'd41d8cd98f00b204e9800998ecf8427e',
    );
    req.userId = decoded.id;
    return next();
  } catch (err) {
    return res.status(400).json({
      error: true,
      mensagem: 'Error: Login required!!!',
    });
  }
}

app.listen(3001, (req, res) => {
  console.log('Rodando http://localhost:3001');
});
