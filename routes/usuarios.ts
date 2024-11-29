import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { verificaToken } from "../middlewares/verificaToken"

const prisma = new PrismaClient()
const router = Router()

const usuarioSchema = z.object({
  nome: z.string(),
  email: z.string(),
  senha: z.string(),
  farmaciaId: z.number()
})

router.get("/", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany()
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(400).json(error)
  }
})

function validaSenha(senha: string) {

  const msg: string[] = []

  if (senha.length < 8) {
    msg.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }

  // contadores
  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  for (const letra of senha) {
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0) {
    msg.push("Erro... senha deve possuir letra(s) minúscula(s)")
  }

  if (grandes == 0) {
    msg.push("Erro... senha deve possuir letra(s) maiúscula(s)")
  }

  if (numeros == 0) {
    msg.push("Erro... senha deve possuir número(s)")
  }

  if (simbolos == 0) {
    msg.push("Erro... senha deve possuir símbolo(s)")
  }

  return msg
}

router.post("/", async (req, res) => {

  const valida = usuarioSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const erros = validaSenha(valida.data.senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }

  const salt = bcrypt.genSaltSync(12)
  const hash = bcrypt.hashSync(valida.data.senha, salt)

  try {
    const usuario = await prisma.usuario.create({
      data: { ...valida.data, senha: hash }
    })
    res.status(201).json(usuario)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.delete("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params

  try {
    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true, 
        deletedAt: new Date() 
      }
    })

    await prisma.log.create({
      data: { 
        descricao: `Exclusão do usuario: ${id}`, 
        complemento: `Funcionário: ${req.userLogadoNome}`,
        usuarioId: req.userLogadoId
      }
    })

    res.status(200).json(usuario)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

export default router