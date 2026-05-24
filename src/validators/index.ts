import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha muito curta"),
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Nome deve ter no minimo 3 caracteres"),
  description: z.string().optional(),
  SKU: z.string().optional(),
  categoryId: z.string().min(1, "Categoria e obrigatoria"),
  supplierId: z.string().min(1, "Fornecedor e obrigatorio"),
  costPrice: z.number().min(0, "Preco de custo nao pode ser negativo"),
  salePrice: z.number().positive("Preco de venda deve ser positivo"),
  stock: z.object({
    physical: z.number().int().min(0, "Quantidade nao pode ser negativa"),
  }),
  minStock: z.number().int().min(0, "Estoque minimo nao pode ser negativo"),
});

export const createCustomerSchema = z.object({
  name: z.string().min(3, "Nome e obrigatorio"),
  documentType: z.enum(["CPF", "CNPJ"]),
  document: z.string().min(11, "Documento obrigatorio"),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  address: z
    .object({
      cep: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      complement: z.string().optional(),
    })
    .optional(),
});
