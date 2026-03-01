import { useQuery } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { saleService } from "@/services";
import type { Sale } from "@/types";

export default function SalesPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: saleService.getAll,
  });

  // ===============================
  // Colunas principais
  // ===============================
  const columns = [
    {
      key: "customer",
      label: "Cliente",
      render: (sale: Sale) =>
        typeof sale.customer === "object"
          ? sale.customer?.name
          : "—",
    },
    {
      key: "totalValue",
      label: "Total",
      render: (sale: Sale) =>
        `R$ ${sale.totalValue?.toFixed(2)}`,
    },
    {
      key: "seller",
      label: "Vendedor",
      render: (sale: Sale) =>
        typeof sale.seller === "object"
          ? sale.seller?.name
          : "—",
    },
    {
      key: "createdAt",
      label: "Data",
      render: (sale: Sale) =>
        sale.createdAt
          ? new Date(sale.createdAt).toLocaleDateString("pt-BR")
          : "—",
    },
  ];

  // ===============================
  // Modal de Detalhes
  // ===============================
  const getDetailFields = (sale: Sale) => [
    {
      label: "Data",
      value: sale.createdAt
        ? new Date(sale.createdAt).toLocaleDateString("pt-BR")
        : "—",
    },
    {
      label: "Cliente",
      value:
        typeof sale.customer === "object"
          ? sale.customer?.name
          : "—",
    },
    {
      label: "Total",
      value: `R$ ${sale.totalValue?.toFixed(2)}`,
    },
    {
      label: "Vendedor",
      value:
        typeof sale.seller === "object"
          ? sale.seller?.name
          : "—",
    },
  ];

  const getDetailItems = (sale: Sale) => ({
    columns: [
      { key: "product", label: "Produto" },
      { key: "quantity", label: "Qtd" },
      { key: "unitPrice", label: "Preço Unit." },
      { key: "total", label: "Subtotal" },
    ],
    data: (sale.items || []).map((item) => ({
      product:
        typeof item.product === "object"
          ? item.product?.name
          : item.product,
      quantity: item.quantity,
      unitPrice: `R$ ${item.unitPrice?.toFixed(2)}`,
      total: `R$ ${(item.quantity * item.unitPrice).toFixed(2)}`,
    })),
  });

  return (
    <div className="flex flex-col">
      <AppHeader title="Vendas" />
      <div className="flex-1 p-6">

        <DataTable
          columns={columns}
          data={data}
          loading={isLoading}
          getDetailFields={getDetailFields}
          getDetailItems={getDetailItems}
        />
      </div>
    </div>
  );
}
