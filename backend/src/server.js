require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const { sequelize } = require('./models');

const app = express();
app.use(express.json());
app.use('/api', routes);

const port = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(port, () => console.log(`Backend running on ${port}`));
});
