import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { verificaToken } from '../middlewares/verificaToken'

const prisma = new PrismaClient()
const router = Router()

const farmaciaSchema = z.object({
    razaoSocial: z.string(),
    cnpj: z.string(),
    telefone: z.string(),
})

router.get("/", async (req, res) => {
  try {
    const farmacias = await prisma.farmacia.findMany({
      orderBy: { id: 'desc' }
    })
    res.status(200).json(farmacias)
  } catch (error) {
    res.status(500).json({erro: error})
  }
})

router.get("/:idFarmacia/medicamentos", async (req, res) => {
    const { idFarmacia } = req.params;
    try {
      const medicamentos = await prisma.medicamento.findMany({
        where: {farmaciaId: Number(idFarmacia), isDeleted: false},
        orderBy: { id: 'asc' },
        select: {
            nomeMedicamento: true,
            preco: true,
            codigo_barras: true,
            controlado: true,
            estoque: true
        }
      })

      const farmacia = await prisma.farmacia.findFirst({
        where: { id: Number(idFarmacia) }
      })
      res.status(200).json({message: `Medicamento da filial ${farmacia?.razaoSocial}`, medicamentos})
    } catch (error) {
      res.status(500).json({erro: error})
    }
})

router.get("/:idFarmacia/funcionarios", verificaToken, async (req, res) => {
    const { idFarmacia } = req.params;
    try {
      const medicamentos = await prisma.usuario.findMany({
        where: {farmaciaId: Number(idFarmacia), isDeleted: false},
        orderBy: { id: 'asc' },
        select: {
            nome: true,
            email: true
        }
      })

      const farmacia = await prisma.farmacia.findFirst({
        where: { id: Number(idFarmacia) }
      })
      res.status(200).json({message: `Funcionarios da filial ${farmacia?.razaoSocial}`, medicamentos})
    } catch (error) {
      res.status(500).json({erro: error})
    }
})

router.post("/", async (req, res) => {

  const valida = farmaciaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const farmacia = await prisma.farmacia.create({
      data: valida.data
    })
    res.status(201).json(farmacia)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.delete("/:id", verificaToken, async (req: any, res) => {
  const { id } = req.params

  try {
    const farmacia = await prisma.farmacia.update({
      where: { id: Number(id) },
      data: {
        isDeleted: true, 
        deletedAt: new Date() 
      }
    })

    await prisma.log.create({
      data: { 
        descricao: `Exclusão da farmacia: ${id}`, 
        complemento: `Funcionário: ${req.userLogadoNome}`,
        usuarioId: req.userLogadoId
      }
    })

    res.status(200).json(farmacia)
  } catch (error) {
    res.status(400).json({ erro: error })
  }
})

router.put("/:id", verificaToken, async (req, res) => {
  const { id } = req.params

  const valida = farmaciaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  try {
    const farmacia = await prisma.farmacia.update({
      where: { id: Number(id) },
      data: valida.data
    })
    res.status(201).json(farmacia)
  } catch (error) {
    res.status(400).json({ error })
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const farmacias = await prisma.farmacia.findMany({
      where: { id: Number(id) }
    })
    res.status(200).json(farmacias)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router
