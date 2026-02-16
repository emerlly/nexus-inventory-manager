import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface DetailField {
  label: string;
  value: React.ReactNode;
}

interface DetailItem {
  columns: { key: string; label: string }[];
  data: Record<string, any>[];
}

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: DetailField[];
  items?: DetailItem;
}

export function DetailDialog({ open, onOpenChange, title, fields, items }: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {fields.map((f, i) => (
            <div key={i} className={typeof f.value === "string" && f.value.length > 40 ? "col-span-2" : ""}>
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="text-sm font-medium">{f.value || "—"}</p>
            </div>
          ))}
        </div>

        {items && items.data.length > 0 && (
          <>
            <Separator className="my-2" />
            <p className="text-sm font-semibold mb-2">Itens ({items.data.length})</p>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {items.columns.map((c) => (
                      <TableHead key={c.key}>{c.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.data.map((row, i) => (
                    <TableRow key={i}>
                      {items.columns.map((c) => (
                        <TableCell key={c.key}>{row[c.key] ?? "—"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
