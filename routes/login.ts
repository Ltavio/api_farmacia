import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { format } from 'date-fns';

// const prisma = new PrismaClient()
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
})

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Params: ' + e.params)
  console.log('Duration: ' + e.duration + 'ms')
})

const router = Router()

const validacaoLogin = async (id: number) => {
  const log = await prisma.log.findFirst({
    where: { usuarioId: id },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true
    }
  })
  const usuario = await prisma.usuario.findFirst({
      where: { id: id },
      select: {
        id: true,
        nome: true
      }
  })

  if(log) {
    const date = new Date(log!.createdAt);
    const formattedDate = format(date, 'HH:mm:ss dd/MM/yyyy');
  
    return `Bem-vindo ${usuario?.nome}. Seu último acesso ao sistema foi ${formattedDate}`
  } else {
    return `Bem-vindo ${usuario?.nome}. Este é o seu primeiro acesso ao sistema`
  }
}

router.post("/", async (req, res) => {
  const { email, senha } = req.body

  // em termos de segurança, o recomendado é exibir uma mensagem padrão
  // a fim de evitar de dar "dicas" sobre o processo de login para hackers
  const msgPadrao = "Login ou senha incorretos"

  if (!email || !senha) {
    // res.status(400).json({ erro: "Informe e-mail e senha do usuário" })
    res.status(400).json({ erro: msgPadrao })
    return
  }

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { email }
    })

    const valid = await validacaoLogin(Number(usuario?.id))

    if (usuario == null) {
      // res.status(400).json({ erro: "E-mail inválido" })
      res.status(400).json({ erro: msgPadrao })
      return
    }

    // se o e-mail existe, faz-se a comparação dos hashs
    if (bcrypt.compareSync(senha, usuario.senha)) {
      // se confere, gera e retorna o token
      const token = jwt.sign({
        userLogadoId: usuario.id,
        userLogadoNome: usuario.nome
      },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      )
      
      res.status(200).json({
        message: await validacaoLogin(Number(usuario.id)),
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        token
      })

      await prisma.log.create({
        data: { 
          descricao: "Login realizado com sucesso", 
          complemento: `Funcionário: ${usuario.email}`,
          usuarioId: usuario.id
        }
      })
    } else {
      // res.status(400).json({ erro: "Senha incorreta" })

      await prisma.log.create({
        data: { 
          descricao: "Tentativa de Acesso Inválida", 
          complemento: `Funcionário: ${usuario.email}`,
          usuarioId: usuario.id
        }
      })

      res.status(400).json({ erro: msgPadrao })
    }
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router