import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AppHeader } from "@/components/AppHeader";
import { DataTable } from "@/components/DataTable";
import { userService } from "@/services";
import { useFetch } from "@/hooks/useQueryWrapper";
import type { User, UserFormData } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ConfirmSaveDialog } from "@/components/ConfirmSaveDialog";

export default function UsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>({ name: "", email: "", cpf: "", password: "", role: "operator" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);

  const { data: usersPage, isLoading } = useFetch(["users", page, limit], () => userService.getPage(page, limit));
  const data = usersPage?.items || [];

  const save = useMutation({
    mutationFn: (d: UserFormData) => editing ? userService.update(editing._id, d) : userService.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); setOpen(false); toast({ title: "Salvo com sucesso!" }); },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar" }),
  });

  const del = useMutation({
    mutationFn: (u: User) => userService.remove(u._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast({ title: "Excluído!" }); },
    onError: () => toast({ variant: "destructive", title: "Erro ao excluir" }),
  });

  const openNew = () => { setEditing(null); setForm({ name: "", email: "", cpf: "", password: "", role: "operator" }); setOpen(true); };
  const openEdit = (u: User) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role }); setOpen(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmOpen(true);
  };

  return (
    <div className="flex flex-col">
      <AppHeader title="Usuários" />
      <div className="flex-1 p-6">
        <DataTable
          columns={[
            { key: "name", label: "Nome" },
            { key: "email", label: "E-mail" },
            { key: "role", label: "Perfil" },
            { key: "companyId", label: "Empresa" },
            { key: "active", label: "Situação", render: (u: User) => u.active ? <span className="text-green-600">Ativo</span> : <span className="text-red-600">Inativo</span> },
          ]}
          data={data}
          loading={isLoading}
          onAdd={openNew}
          onEdit={openEdit}
          onDelete={(u) => del.mutate(u)}
          addLabel="Novo Usuário"
          searchPlaceholder="Buscar usuários..."
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {usersPage?.page || page} de {usersPage?.pages || 1}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= (usersPage?.pages || 1) || isLoading}
          >
            Proxima
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={form.password || ""} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
            )}
            {!editing && (
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={form.cpf || ""} onChange={(e) => setForm({ ...form, cpf: e.target.value })} required />
              </div>
            )}
            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserFormData["role"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operador</SelectItem>
                  <SelectItem value="seller">Vendedor</SelectItem>
                  <SelectItem value="stockist">Estoquista</SelectItem>
                  <SelectItem value="manager">Gerente</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmSaveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => { setConfirmOpen(false); save.mutate(form); }}
        title={editing ? "Confirmar edição" : "Confirmar cadastro"}
        description={editing ? "Deseja salvar as alterações deste usuário?" : "Deseja cadastrar este novo usuário?"}
        isPending={save.isPending}
      />
    </div>
  );
}
