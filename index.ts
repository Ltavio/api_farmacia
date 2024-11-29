import express from 'express'
import routesMedicamentos from './routes/medicamentos'
import routesFarmacia from './routes/farmacia'
import routesUsuarios from './routes/usuarios'
import routesLogin from './routes/login'

const app = express()
const port = 3003

app.use(express.json())

app.use("/medicamentos", routesMedicamentos)
app.use("/farmacia", routesFarmacia)
app.use("/usuarios", routesUsuarios)
app.use("/login", routesLogin)

app.get('/', (req, res) => {
  res.send('API de Cadastro de Carros')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})