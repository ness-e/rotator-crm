/**
 * @file useApi.js
 * @description Archivo del sistema useApi.js.
 * @module Module
 * @path /frontend/src/hooks/useApi.js
 * @lastUpdated 2026-03-11
 * @author Sistema (Auto-Generated)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { toast } from 'sonner';

// ============ USERS HOOKS ============

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users');
            if (!res.ok) throw new Error('Error al cargar usuarios');
            return res.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/users', data);
            if (!res.ok) throw new Error('Error al crear usuario');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('Usuario creado exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al crear usuario');
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.put(`/users/${id}`, data);
            if (!res.ok) throw new Error('Error al actualizar usuario');
            if (res.status === 204) return null;
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('Usuario actualizado exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al actualizar usuario');
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/users/${id}`);
            if (!res.ok) throw new Error('Error al eliminar usuario');
            if (res.status === 204) return null;
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['users']);
            toast.success('Usuario eliminado exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al eliminar usuario');
        },
    });
}

// ============ LICENSES HOOKS ============

export function useLicenses() {
    return useQuery({
        queryKey: ['licenses'],
        queryFn: async () => {
            const res = await api.get('/licenses');
            if (!res.ok) throw new Error('Error al cargar licencias');
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateLicense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/licenses', data);
            if (!res.ok) throw new Error('Error al crear licencia');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['licenses']);
            toast.success('Licencia creada exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al crear licencia');
        },
    });
}

export function useUpdateLicense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.put(`/licenses/${id}`, data);
            if (!res.ok) throw new Error('Error al actualizar licencia');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['licenses']);
            toast.success('Licencia actualizada exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al actualizar licencia');
        },
    });
}

export function useDeleteLicense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/licenses/${id}`);
            if (!res.ok) throw new Error('Error al eliminar licencia');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['licenses']);
            toast.success('Licencia eliminada exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al eliminar licencia');
        },
    });
}

// ============ CLIENTS HOOKS ============

export function useClients() {
    return useQuery({
        queryKey: ['clients'],
        queryFn: async () => {
            const res = await api.get('/clients');
            if (!res.ok) throw new Error('Error al cargar clientes');
            return res.json();
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/clients', data);
            if (!res.ok) throw new Error('Error al crear cliente');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            toast.success('Cliente creado exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al crear cliente');
        },
    });
}

export function useUpdateClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.put(`/clients/${id}`, data);
            if (!res.ok) throw new Error('Error al actualizar cliente');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            toast.success('Cliente actualizado exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al actualizar cliente');
        },
    });
}

export function useDeleteClient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/clients/${id}`);
            if (!res.ok) throw new Error('Error al eliminar cliente');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['clients']);
            toast.success('Cliente eliminado exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al eliminar cliente');
        },
    });
}

// ============ PROSPECTS HOOKS ============

export function useProspects() {
    return useQuery({
        queryKey: ['prospects'],
        queryFn: async () => {
            const res = await api.get('/prospects');
            if (!res.ok) throw new Error('Error al cargar prospectos');
            return res.json();
        },
        staleTime: 2 * 60 * 1000, // 2 minutos (más frecuente para CRM)
    });
}

export function useCreateProspect() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            const res = await api.post('/prospects', data);
            if (!res.ok) throw new Error('Error al crear prospecto');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['prospects']);
            toast.success('Prospecto creado exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al crear prospecto');
        },
    });
}

export function useUpdateProspect() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const res = await api.put(`/prospects/${id}`, data);
            if (!res.ok) throw new Error('Error al actualizar prospecto');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['prospects']);
            toast.success('Prospecto actualizado exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al actualizar prospecto');
        },
    });
}

export function useDeleteProspect() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/prospects/${id}`);
            if (!res.ok) throw new Error('Error al eliminar prospecto');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['prospects']);
            toast.success('Prospecto eliminado exitosamente');
        },
        onError: (error) => {
            toast.error(error.message || 'Error al eliminar prospecto');
        },
    });
}

// ============ ACTIVATIONS HOOKS ============

export function useActivations() {
    return useQuery({
        queryKey: ['activations'],
        queryFn: async () => {
            const res = await api.get('/activations');
            if (!res.ok) throw new Error('Error al cargar activaciones');
            return res.json();
        },
        staleTime: 1 * 60 * 1000, // 1 minuto (datos en tiempo real)
    });
}
