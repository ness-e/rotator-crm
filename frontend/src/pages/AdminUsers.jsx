/**
 * @file AdminUsers.jsx
 * @description Gestión de Usuarios (Staff y Clientes).
 * @module Frontend Page
 * @path /frontend/src/pages/AdminUsers.jsx
 */

import React, { useState } from 'react';
import { Users, UserPlus, Pencil, Trash2, Building2 } from 'lucide-react';
import InfoHint from '@/components/ui/InfoHint';
import { SYSTEM_HINTS } from '@/utils/hints';
import { DataTable } from '@/components/DataTable';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import { GlobalPhoneInput } from '@/components/GlobalSelects';
import { useDebouncedValue } from '../utils/debounce';
import AdminGestionLayout from '@/components/AdminGestionLayout';

// Schema aligned with Prisma User model
const userSchema = z.object({
  firstName: z.string().min(1, 'Nombre requerido'),
  lastName: z.string().min(1, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  role: z.enum(['MASTER', 'ANALISTA', 'VISUALIZADOR', 'CLIENTE']).default('CLIENTE'),
  organizationId: z.string().min(1, 'Organización requerida'), // Form handles as string
  phone: z.string().optional(),
  password: z.string().optional()
});

export default function AdminUsers() {
  const { toast } = useToast();

  // Data
  const { data: users = [], isLoading } = useUsers();

  // Fetch Organizations for dropdown
  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await fetch('/api/crm/organizations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      return res.json();
    }
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const debouncedSearch = useDebouncedValue(searchValue, 300);

  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const form = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'CLIENTE',
      organizationId: '',
      phone: '',
      password: ''
    }
  });

  const onSubmit = async (values) => {
    try {
      if (editing) {
        // Only include password if set
        const payload = { ...values };
        if (!payload.password) delete payload.password;

        await updateUser.mutateAsync({ id: editing.id, data: payload });
      } else {
        await createUser.mutateAsync(values);
      }
      setOpen(false);
      setEditing(null);
      form.reset();
    } catch (e) {
      // Handled by hook
    }
  };

  const handleEdit = (user) => {
    setEditing(user);
    form.reset({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      organizationId: user.organizationId ? String(user.organizationId) : '',
      phone: user.phone || '',
      password: ''
    });
    setOpen(true);
  };

  const handleNew = () => {
    setEditing(null);
    form.reset({ firstName: '', lastName: '', email: '', role: 'CLIENTE', organizationId: '', phone: '', password: '' });
    setOpen(true);
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    await deleteUser.mutateAsync(userToDelete.id);
    setDeleteConfirmOpen(false);
  };

  const filtered = users.filter((u) => {
    const search = debouncedSearch.toLowerCase();
    const fn = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
    return fn.includes(search) ||
           u.email?.toLowerCase().includes(search);
  });

  const isAll = String(pageSize) === 'all';
  const totalPages = isAll ? 1 : Math.max(1, Math.ceil(filtered.length / Number(pageSize)));
  const currentPage = Math.min(page, totalPages);
  const start = isAll ? 0 : (currentPage - 1) * Number(pageSize);
  const pageItems = isAll ? filtered : filtered.slice(start, start + Number(pageSize));

  const columns = [
    {
      key: 'name', label: 'Usuario', render: (_, r) => (
        <div>
          <div className="font-medium text-slate-900 dark:text-slate-100">{`${r.firstName || ''} ${r.lastName || ''}`.trim() || r.email}</div>
          <div className="text-xs text-muted-foreground">{r.email}</div>
        </div>
      )
    },
    {
      key: 'organization', label: 'Organización', render: (v, r) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.organization?.name || 'Sin Asignar'}</span>
        </div>
      )
    },
    { key: 'role', label: 'Rol', render: (v) => <StatusBadge status={v === 'MASTER' ? 'active' : v === 'ANALISTA' ? 'warning' : 'info'} label={v} /> },
    {
      key: 'actions', label: '', render: (_, r) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(r)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => confirmDelete(r)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )
    }
  ];

  return (
    <>
      <AdminGestionLayout
        title="Usuarios"
        description="Directorio global de usuarios y accesos."
        icon={Users}
        searchValue={searchValue}
        onSearchChange={(v) => { setSearchValue(v); setPage(1); }}
        pageSize={pageSize}
        onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        onPageChange={setPage}
        searchPlaceholder="Buscar por nombre o correo electrónico..."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew} className="rounded-xl shadow-lg hover:scale-105 transition-all">
                <UserPlus className="mr-2 h-4 w-4" /> Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Usuario' : 'Crear Usuario'}</DialogTitle>
                <DialogDescription>
                  {editing ? 'Modifica los datos del usuario existente.' : 'Ingresa la información para el nuevo usuario.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (
                      <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (
                      <FormItem><FormLabel>Apellido</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="organizationId" render={({ field }) => (
                      <FormItem><FormLabel>Organización</FormLabel><FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border bg-background px-3">
                          <option value="">Seleccionar...</option>
                          {orgs.map(o => (
                            <option key={o.id} value={String(o.id)}>{o.name}</option>
                          ))}
                        </select>
                      </FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2 mb-1">
                          <FormLabel className="mb-0">Rol</FormLabel>
                          <InfoHint content={SYSTEM_HINTS.USER_ROLE} />
                        </div>
                        <FormControl>
                          <select {...field} className="flex h-10 w-full rounded-md border bg-background px-3">
                            <option value="CLIENTE">CLIENTE</option>
                            <option value="ANALISTA">ANALISTA</option>
                            <option value="VISUALIZADOR">VISUALIZADOR</option>
                            <option value="MASTER">MASTER</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>Teléfono</FormLabel><FormControl><GlobalPhoneInput value={field.value || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem><FormLabel>Contraseña {editing && '(Opcional)'}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      >
        <DataTable columns={columns} data={pageItems} loading={isLoading} />
      </AdminGestionLayout>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`¿Eliminar a ${userToDelete?.firstName || ''} ${userToDelete?.lastName || ''}?`.trim()}
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </>
  );
}
