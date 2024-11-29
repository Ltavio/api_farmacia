import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { verificaToken } from '../middlewares/verificaToken'

const prisma = new PrismaClient()
const router = Router()

const medicamentoSchema = z.object({
  nomeMedicamento: z.string(),
  controlado: z.boolean().optional(),
  estoque: z.number(),
  preco: z.number().positive(
    { message: "Preço não pode ser negativo" }),
  codigo_barras: z.number(),
  farmaciaId: z.number()
})

router.get("/", async (req, res) => {
  try {
    const medicamentos = await prisma.medicamento.findMany({
      where: {isDeleted: false},
      orderBy: { id: 'desc' }
    })
    res.status(200).json(medicamentos)
  } catch (error) {
    res.status(500).json({erro: error})
  }
})

router.post("/", verificaToken, async (req, res) => {

  const valida = medicamentoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const medicamento = await prisma.medicamento.create({
      data: valida.data
    })
    res.status(201).json(medicamento)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params

  try {
    await prisma.medicamento.update({
      where: { id: Number(id), isDeleted: false },
      data: {
        isDeleted: true, 
        deletedAt: new Date() 
      }
    })

    await prisma.log.create({
      data: { 
        descricao: `Exclusão do medicamento: ${id}`, 
        complemento: `Funcionário: ${req.userLogadoNome}`,
        usuarioId: req.userLogadoId
      }
    })

    res.status(200).json({ mensagem: "Medicamento deletado com sucesso." })
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", verificaToken, async (req, res) => {
  const { id } = req.params

  const valida = medicamentoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const medicamento = await prisma.medicamento.update({
      where: { id: Number(id), isDeleted: false },
      data: valida.data
    })
    res.status(201).json(medicamento)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.patch("/:id", async (req, res) => {
  const { id } = req.params

  const partialmedicamentoSchema = medicamentoSchema.partial()

  const valida = partialmedicamentoSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const medicamento = await prisma.medicamento.update({
      where: { id: Number(id), isDeleted: false },
      data: valida.data
    })
    res.status(201).json(medicamento)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.get("/pesquisa/:codigo_barras", async (req, res) => {
  const { codigo_barras } = req.params
  try {
    const medicamentos = await prisma.medicamento.findMany({
      where: { codigo_barras: Number(codigo_barras), isDeleted: false }
    })
    if (medicamentos) {
      res.status(404).json(medicamentos)
    }
    res.status(200).json(medicamentos)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router
